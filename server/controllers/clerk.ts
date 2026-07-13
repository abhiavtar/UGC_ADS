import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma.js";
import * as Sentry from "@sentry/node";

type ClerkUserData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  primary_email_address_id: string | null;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
};

const planCredits = { pro: 20000, premium: 58000 } as const;
type PlanId = keyof typeof planCredits;

const getPlanId = (...values: Array<string | null | undefined>): PlanId | null => {
  const planText = values.filter(Boolean).join(" ").toLowerCase();

  if (planText.includes("premium")) {
    return "premium";
  }

  if (planText.includes("pro")) {
    return "pro";
  }

  return null;
};

const getBillingItemPlanId = (item?: {
  plan?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  plan_id?: string | null;
  planId?: string | null;
}) => getPlanId(item?.plan?.slug, item?.plan?.name, item?.plan?.id, item?.plan_id, item?.planId);

const isCreditEligibleStatus = (status?: string | null) =>
  status === "active" || status === "trialing";

const isCreditEligibleBillingItem = (item?: {
  status?: string | null;
  is_free_trial?: boolean | null;
  isFreeTrial?: boolean | null;
}) =>
  isCreditEligibleStatus(item?.status) ||
  item?.is_free_trial === true ||
  item?.isFreeTrial === true;

const applyPlanCredits = async ({
  clerkUserId,
  planId,
}: {
  clerkUserId: string;
  planId: PlanId;
}) => {
  await prisma.user.updateMany({
    where: {
      id: clerkUserId,
      credits: { lt: planCredits[planId] },
    },
    data: {
      credits: planCredits[planId],
    },
  });
};

const logUnknownBillingPlan = (eventType: string, payload: unknown) => {
  console.warn(
    `Clerk billing webhook ignored because plan was not recognized: ${eventType}`,
    JSON.stringify(payload, null, 2),
  );
};

const normalizeUser = (user: ClerkUserData) => {
  const email =
    user.email_addresses.find(
      ({ id }) => id === user.primary_email_address_id,
    )?.email_address ?? user.email_addresses[0]?.email_address;

  if (!email) {
    throw new Error(`Clerk user ${user.id} has no email address`);
  }

  return {
    email,
    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    image: user.image_url ?? "",
  };
};

const clerkWebhooks = async (req: Request, res: Response) => {
  let event;

  try {
    event = await verifyWebhook(req);
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const user = normalizeUser(event.data);

        // Upsert makes both event types safe if Clerk retries or delivers out of order.
        await prisma.user.upsert({
          where: { id: event.data.id },
          create: { id: event.data.id, ...user },
          update: user,
        });
        break;
      }

      case "user.deleted": {
        if (event.data.id) {
          await prisma.user.deleteMany({
            where: { id: event.data.id },
          });
        }
        break;
      }

      case "paymentAttempt.created":
      case "paymentAttempt.updated": {
        const { data } = event;
        const isPaidSubscription =
          (data.charge_type === "recurring" ||
            data.charge_type === "checkout") &&
          data.status === "paid";

        if (!isPaidSubscription) {
          break;
        }

        const clerkUserId = data.payer?.user_id;
        const planId = getBillingItemPlanId(data.subscription_items?.[0]);

        if (!clerkUserId) {
          throw new Error("Paid Clerk event has no user ID");
        }

        if (!planId) {
          logUnknownBillingPlan(event.type, data.subscription_items?.[0]);
          break;
        }

        await applyPlanCredits({ clerkUserId, planId });
        break;
      }

      case "subscription.created":
      case "subscription.updated":
      case "subscription.active": {
        const { data } = event;
        const activeItem =
          data.items?.find(isCreditEligibleBillingItem) ?? data.items?.[0];
        const clerkUserId = data.payer?.user_id ?? data.payer_id;
        const planId = getBillingItemPlanId(activeItem);

        if (!clerkUserId) {
          throw new Error("Clerk subscription event has no user ID");
        }

        if (!planId) {
          logUnknownBillingPlan(event.type, activeItem);
          break;
        }

        if (
          isCreditEligibleStatus(data.status) ||
          isCreditEligibleBillingItem(activeItem)
        ) {
          await applyPlanCredits({ clerkUserId, planId });
        }
        break;
      }

      case "subscriptionItem.created":
      case "subscriptionItem.updated":
      case "subscriptionItem.active": {
        const { data } = event;
        const clerkUserId = data.payer?.user_id;
        const planId = getBillingItemPlanId(data);

        if (!clerkUserId) {
          throw new Error("Clerk subscription item event has no user ID");
        }

        if (!planId) {
          logUnknownBillingPlan(event.type, data);
          break;
        }

        if (isCreditEligibleBillingItem(data)) {
          await applyPlanCredits({ clerkUserId, planId });
        }
        break;
      }
    }

    return res.status(200).json({ message: `Webhook received: ${event.type}` });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Clerk webhook processing failed:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

export default clerkWebhooks;
