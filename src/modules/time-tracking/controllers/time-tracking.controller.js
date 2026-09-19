import * as timeTrackingService from "../services/time-tracking.service.js";

export const createTimeEntryController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.createTimeEntry({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      taskId: req.validated.params.taskId,
      validated: req.validated.body,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const stopTimeEntryController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.stopTimeEntry({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      entryId: req.validated.params.entryId,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateTimeEntryController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.updateTimeEntry({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      entryId: req.validated.params.entryId,
      validated: req.validated.body,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deleteTimeEntryController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.deleteTimeEntry({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      entryId: req.validated.params.entryId,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listTaskTimeEntriesController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.listTaskTimeEntries({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      taskId: req.validated.params.taskId,
      validated: req.validated.query,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const listMyTimeEntriesController = async (req, res, next) => {
  try {
    const result = await timeTrackingService.listMyTimeEntries({
      userId: req.userId || req.user?.id,
      tenantId: req.tenantId || req.tenant?.id,
      validated: req.validated.query,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
