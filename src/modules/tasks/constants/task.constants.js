// Task constants
export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
};

// Allowed forward/backward status transitions.
// null key = initial transitions (from any state) — here every state may change
// to any other except a few logical guards enforced below.
export const TASK_STATUS_TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED', 'TODO', 'DONE', 'CANCELLED'],
  IN_REVIEW: ['IN_PROGRESS', 'DONE', 'BLOCKED', 'TODO', 'CANCELLED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
  DONE: ['IN_PROGRESS', 'IN_REVIEW', 'TODO'],
  CANCELLED: ['TODO'],
};

export const isAllowedStatusTransition = (from, to) => {
  if (from === to) return true;
  const allowed = TASK_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
};

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const TASK_AUDIT_ACTIONS = {
  CREATE: 'TASK_CREATE',
  UPDATE: 'TASK_UPDATE',
  DELETE: 'TASK_DELETE',
  STATUS_CHANGE: 'TASK_STATUS_CHANGE',
  ASSIGNEE_ADD: 'TASK_ASSIGNEE_ADD',
  ASSIGNEE_REMOVE: 'TASK_ASSIGNEE_REMOVE',
  COMMENT_ADD: 'TASK_COMMENT_ADD',
  COMMENT_DELETE: 'TASK_COMMENT_DELETE',
};
