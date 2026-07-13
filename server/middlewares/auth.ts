import { Request, Response, NextFunction } from 'express';
import * as Sentry from "@sentry/node"
import { clerkClient } from '@clerk/express';
import { prisma } from '../configs/prisma.js';

const ensureUserInDatabase = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (existingUser) {
    return;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find(
      ({ id }) => id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${userId} has no email address`);
  }

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
      image: clerkUser.imageUrl ?? '',
    },
  });
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await ensureUserInDatabase(userId);

    next();
  } catch (error: any) {
    Sentry.captureException(error)
    res.status(401).json({
      message: error.code || error.message,
    });
  }
};
