import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { prisma } from '../configs/prisma.js';
import { clerkClient } from '@clerk/express';

const planCredits = { pro: 20000, premium: 58000 } as const;
type PlanId = keyof typeof planCredits;

const getPlanId = (...values: Array<string | null | undefined>): PlanId | null => {
  const planText = values.filter(Boolean).join(' ').toLowerCase();

  if (planText.includes('premium')) {
    return 'premium';
  }

  if (planText.includes('pro')) {
    return 'pro';
  }

  return null;
};

const getBillingItemPlanId = (item?: {
  plan?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  planId?: string | null;
}) => getPlanId(item?.plan?.slug, item?.plan?.name, item?.plan?.id, item?.planId);

const isCreditEligibleStatus = (status?: string | null) =>
  status === 'active' || status === 'trialing';

const isCreditEligibleBillingItem = (item?: {
  status?: string | null;
  isFreeTrial?: boolean | null;
}) => isCreditEligibleStatus(item?.status) || item?.isFreeTrial === true;

const syncCreditsFromClerkBilling = async (userId: string, currentCredits: number) => {
  try {
    const subscription = await clerkClient.billing.getUserBillingSubscription(userId);
    const activeItem =
      subscription.subscriptionItems.find(isCreditEligibleBillingItem) ??
      subscription.subscriptionItems[0];
    const planId = getBillingItemPlanId(activeItem);

    if (
      !planId ||
      (!isCreditEligibleStatus(subscription.status) &&
        !isCreditEligibleBillingItem(activeItem))
    ) {
      return currentCredits;
    }

    const planCreditAmount = planCredits[planId];

    if (currentCredits >= planCreditAmount) {
      return currentCredits;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: planCreditAmount },
    });

    return planCreditAmount;
  } catch (error) {
    // A user without a Clerk Billing subscription should still receive DB credits.
    Sentry.captureException(error);
    console.warn('Unable to sync Clerk billing credits:', error);
    return currentCredits;
  }
};

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

    const credits = await syncCreditsFromClerkBilling(userId, user.credits);

    res.json({ credits });
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
