import * as notificationService from "../services/notification.service.js";

export const listNotificationsController = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(
      req.user.id,
      req.tenant.id,
      req.validated
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const markReadController = async (req, res, next) => {
  try {
    const result = await notificationService.markRead(
      req.user.id,
      req.tenant.id,
      req.validated.params.notificationId
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const markAllReadController = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user.id, req.tenant.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const unreadCountController = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id, req.tenant.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
