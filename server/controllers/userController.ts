import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { prisma } from '../configs/prisma.js';

// Get user credits
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found in database. Check Clerk webhook delivery for this user.',
      });
    }

    // Keep this endpoint read-only. Plan/trial credits are applied by Clerk
    // webhooks; this endpoint should never top credits back up after usage.
    res.json({ credits: user.credits });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Get all user projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Get project by id
export const getProjectById = async (req: Request, res: Response) => {
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
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Publish / unpublish project
export const toggleProjectPublic = async (req: Request, res: Response) => {
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
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.generatedImage && !project.generatedVideo) {
      return res.status(404).json({
        message: 'image or video not generated',
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { isPublished: !project.isPublished },
    });

    res.json({
      isPublished: updatedProject.isPublished,
      project: updatedProject,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
