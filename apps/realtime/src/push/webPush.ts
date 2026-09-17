import webpush, { type PushSubscription } from 'web-push';

import { env } from '../env.js';

/**
 * Web Push fan-out.
 *
 * Subscriptions live in memory here; move them to the same database as the
 * users table. The important production detail is the 404/410 handling below:
 * expired endpoints must be pruned or every send accumulates dead work.
 */
const subscriptions = new Map<string, Map<string, PushSubscription>>();

let configured = false;

export function configurePush(): boolean {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export function saveSubscription(userId: string, subscription: PushSubscription) {
  const forUser = subscriptions.get(userId) ?? new Map();
  forUser.set(subscription.endpoint, subscription);
  subscriptions.set(userId, forUser);
}

export function removeSubscription(userId: string, endpoint: string) {
  subscriptions.get(userId)?.delete(endpoint);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * Only called when the recipient has no live socket — a mother looking at the
 * conversation must not also get a notification for the message on screen.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  if (!configured) return;

  const forUser = subscriptions.get(userId);
  if (!forUser?.size) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    [...forUser.values()].map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, body, {
          TTL: 3600,
          urgency: 'high',
        });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the endpoint is gone for good — prune it.
        if (status === 404 || status === 410) {
          forUser.delete(subscription.endpoint);
        }
      }
    }),
  );
}
