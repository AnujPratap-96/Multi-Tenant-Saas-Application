import { ApiError } from "../../../utils/api-error.js";
import * as notificationRepo from "../repositories/notification.repository.js";
import { enqueueNotification } from "../../queue/producers/notification.producer.js";

/**
 * Persist + enqueue a notification for a single user.
 * Safe to call in fire-and-forget fashion; failures are logged, not thrown,
 * so notification errors never break the primary operation.
 */
export const notify = async ({ tenantId, userId, type, entityType, entityId, message, data }) => {
  try {
    const row = await notificationRepo.createNotification({
      tenantId,
      userId,
      type,
      entityType,
      entityId,
      message,
      data,
    });
    await enqueueNotification({
      userId,
      type,
      entityType,
      entityId,
      message,
      notificationId: row.id,
    }).catch(() => {});
    return row;
  } catch (err) {
    // Notifications must not break the caller's flow.
    console.error("[notify] failed", err.message);
    return null;
  }
};

export const listNotifications = async (userId, tenantId, validated) => {
  return notificationRepo.listNotifications(tenantId, userId, validated.query);
};

export const markRead = async (userId, tenantId, notificationId) => {
  const result = await notificationRepo.markRead(tenantId, userId, notificationId);
  if (!result) throw new ApiError(404, "Notification not found");
  return result;
};

export const markAllRead = async (userId, tenantId) => {
  return notificationRepo.markAllRead(tenantId, userId);
};

export const getUnreadCount = async (userId, tenantId) => {
  const count = await notificationRepo.getUnreadCount(tenantId, userId);
  return { unreadCount: count };
};
