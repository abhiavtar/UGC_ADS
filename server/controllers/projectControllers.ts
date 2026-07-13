import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { v2 as cloudinary } from 'cloudinary';
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai';
import fs from 'fs';
import path from 'path';
import ai from '../configs/ai.js';
import { prisma } from '../configs/prisma.js';
import axios from 'axios';

const PROJECT_CREATION_CREDIT_COST = 5;
const IMAGE_GENERATION_MODEL = 'gemini-3-pro-image-preview';

const imageGenerationConfig = (aspectRatio: string): GenerateContentConfig => ({
  maxOutputTokens: 32768,
  temperature: 1,
  topP: 0.95,
  responseModalities: ['IMAGE'],
  imageConfig: {
    aspectRatio,
    imageSize: '1K',
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.OFF,
    },
  ],
});

const getProjectId = (req: Request, res: Response) => {
  const { projectId } = req.params;

  if (typeof projectId !== 'string') {
    res.status(400).json({ message: 'Invalid project id' });
    return null;
  }

  return projectId;
};

const getUploadedFiles = (req: Request) => {
  if (!Array.isArray(req.files)) {
    return [];
  }

  return req.files as Express.Multer.File[];
};

const removeLocalFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    Sentry.captureException(error);
  }
};

const loadImage = (filePath: string, mimeType: string) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString('base64'),
    mimeType,
  },
});

const uploadImage = async (file: Express.Multer.File) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'ad-gen-ai/projects',
    resource_type: 'image',
  });

  return result.secure_url;
};

const uploadGeneratedImage = async (base64Image: string) => {
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Image}`,
    {
      folder: 'ad-gen-ai/generated',
      resource_type: 'image',
    },
  );

  return result.secure_url;
};

const getGeneratedImageBuffer = (response: Awaited<ReturnType<typeof ai.models.generateContent>>) => {
  if (!response?.candidates?.[0]?.content?.parts) {
    throw new Error('Unexpected Gemini response');
  }

  const { parts } = response.candidates[0].content;

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error(response.text || 'Gemini did not return an image');
};

const createPrompt = ({
  productName,
  productDescription,
  userPrompt,
}: {
  productName: string;
  productDescription: string;
  userPrompt: string;
}) => ({
  text: `Combine the person and product into a realistic ecommerce photo.
Make the person naturally hold or use the product.
Match lighting, shadows, scale, and perspective.
Make the person stand in professional studio lighting.
Product name: ${productName}
Product description: ${productDescription || 'N/A'}
Additional user instructions: ${userPrompt || 'N/A'}
Output ecommerce-quality photorealistic imagery.`,
});

const generateProjectImage = async ({
  projectId,
  userId,
  images,
  aspectRatio,
  productName,
  productDescription,
  userPrompt,
}: {
  projectId: string;
  userId: string;
  images: Express.Multer.File[];
  aspectRatio: string;
  productName: string;
  productDescription: string;
  userPrompt: string;
}) => {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_GENERATION_MODEL,
      contents: [
        loadImage(images[0].path, images[0].mimetype),
        loadImage(images[1].path, images[1].mimetype),
        createPrompt({ productName, productDescription, userPrompt }),
      ],
      config: imageGenerationConfig(aspectRatio),
    });

    const generatedImageBuffer = getGeneratedImageBuffer(response);
    const generatedImage = await uploadGeneratedImage(
      generatedImageBuffer.toString('base64'),
    );

    await prisma.project.update({
      where: { id: projectId },
      data: {
        generatedImage,
        isGenerating: false,
        error: '',
      },
    });
  } catch (error: any) {
    Sentry.captureException(error);

    try {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          isGenerating: false,
          error: error.message || 'Image generation failed',
        },
      });
    } catch (projectUpdateError) {
      Sentry.captureException(projectUpdateError);
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: PROJECT_CREATION_CREDIT_COST,
          },
        },
      });
    } catch (creditRefundError) {
      Sentry.captureException(creditRefundError);
    }
  } finally {
    images.forEach((image) => removeLocalFile(image.path));
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const images = getUploadedFiles(req);
    const {
      name = 'New Project',
      aspectRatio = '9:16',
      userPrompt = '',
      productName,
      productDescription = '',
      targetLength = 5,
    } = req.body;

    if (images.length < 2) {
      return res.status(400).json({
        message: 'Please upload at least 2 images',
      });
    }

    if (!productName) {
      return res.status(400).json({
        message: 'Product name is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found in database. Check Clerk webhook delivery for this user.',
      });
    }

    if (user.credits < PROJECT_CREATION_CREDIT_COST) {
      return res.status(402).json({ message: 'Insufficient credits' });
    }

    const uploadedImages = await Promise.all(images.map(uploadImage));

    const project = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: PROJECT_CREATION_CREDIT_COST,
          },
        },
      });

      return tx.project.create({
        data: {
          name,
          userId,
          productName,
          productDescription,
          userPrompt,
          aspectRatio,
          targetLength: Number(targetLength) || 5,
          uploadedImages,
          isGenerating: true,
        },
      });
    });

    void generateProjectImage({
      projectId: project.id,
      userId,
      images,
      aspectRatio,
      productName,
      productDescription,
      userPrompt,
    });

    res.status(201).json({
      projectId: project.id,
      project,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  let userId: string | undefined;
  let projectId: string | undefined;
  let isCreditDeducted = false;
  let videoFilePath: string | undefined;

  try {
    userId = req.auth().userId;
    const requestedProjectId = req.body.projectId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (typeof requestedProjectId !== 'string') {
      return res.status(400).json({ message: 'Project id is required' });
    }

    projectId = requestedProjectId;

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user || user.credits < 10) {
        return res.status(401).json({ message: 'Insufficient credits' });
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId, userId },
        include: { user: true }
    })
    
    if (!project || project.isGenerating) {
        return res.status(404).json({ message: 'Generation in progress' });
    }
    
    if (project.generatedVideo) {
        return res.status(404).json({ message: 'Video already generated' });
    }

    if (!project.generatedImage) {
        throw new Error('Generated image not found');
    }

    // deduct credits for video generation
    await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 10 } }
    }).then(() => { isCreditDeducted = true });

    await prisma.project.update({
        where: { id: projectId },
        data: { isGenerating: true }
    })
    
    const prompt = `make the person showcase the product which is ${project.productName} ${project.productDescription && `and Product Description: ${project.productDescription}`}`

    const model = 'veo-3.1-generate-preview'

    const image = await axios.get(project.generatedImage, {
        responseType: 'arraybuffer',
    })

    const imageBytes: any = Buffer.from(image.data)    
    let operation: any = await ai.models.generateVideos({
        model,
        prompt,
        image: {
            imageBytes: imageBytes.toString('base64'),
            mimeType: 'image/png',
        },
        config: {
            aspectRatio: project?.aspectRatio || '9:16',
            numberOfVideos: 1,
            resolution: '720p',
        }
    })

    while (!operation.done) {
        console.log('Waiting for video generation to complete...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({
            operation: operation,
        })
    }
    
    const filename = `${userId}-${Date.now()}.mp4`;
    const filePath = path.join('videos', filename)
    videoFilePath = filePath;
    
    // Create the images directory if it doesn't exist
    fs.mkdirSync('videos', { recursive: true })
    
    if (!operation.response.generatedVideos){
        throw new Error(operation.response.raiMediaFilteredReasons[0])
    }

    // Download the video.
await ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: filePath,
})

const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: 'video'
});

await prisma.project.update({
    where: { id: project.id },
    data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false
    }
})

 // remove video file from disk after upload
removeLocalFile(filePath);
videoFilePath = undefined;

res.json({
    message: 'Video generation completed',
    videoUrl: uploadResult.secure_url
})
  } catch (error: any) {

    if (projectId && userId) {
      try {
        // update project status and error message
        await prisma.project.update({
            where: { id: projectId, userId },
            data: { isGenerating: false, error: error.message }
        })
      } catch (projectUpdateError) {
        Sentry.captureException(projectUpdateError);
      }
    }

	if (isCreditDeducted && userId) {
    try {
	    // add credits back
	    await prisma.user.update({
	        where: { id: userId },
        data: { credits: { increment: 10 } }
    })
    } catch (creditRefundError) {
      Sentry.captureException(creditRefundError);
    }
	}
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  } finally {
    if (videoFilePath) {
      removeLocalFile(videoFilePath);
    }
  }
};

export const getAllPublishedProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (typeof projectId !== 'string') {
        return res.status(400).json({ message: 'Invalid project id' });
    }
    
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId }
    })
    
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    await prisma.project.delete({
        where: { id: projectId }
    })
    
    res.json({ message: 'Project deleted' });
    
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
