import * as notificationService from "../services/notification.service.js";

export const listNotificationsController = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    const tenantId = req.tenantId || req.tenant?.id;
    const result = await notificationService.listNotifications(
      userId,
      tenantId,
      req.validated
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const markReadController = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    const tenantId = req.tenantId || req.tenant?.id;
    const result = await notificationService.markRead(
      userId,
      tenantId,
      req.validated.params.notificationId
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const markAllReadController = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    const tenantId = req.tenantId || req.tenant?.id;
    const result = await notificationService.markAllRead(userId, tenantId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const unreadCountController = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    const tenantId = req.tenantId || req.tenant?.id;
    const result = await notificationService.getUnreadCount(userId, tenantId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
