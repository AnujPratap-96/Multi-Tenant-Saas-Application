// Tenant module constants

export const TENANT_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

export const TENANT_USER_STATUS = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REMOVED: 'REMOVED',
};

export const TENANT_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
};

export const TENANT_PLANS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
};

export const DEFAULT_TENANT_PLAN = TENANT_PLANS.FREE;

export const TENANT_AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  INVITE: 'INVITE',
  INVITE_ACCEPTED: 'INVITE_ACCEPTED',
  INVITE_REJECTED: 'INVITE_REJECTED',
  INVITE_CANCELLED: 'INVITE_CANCELLED',
  INVITE_RESENT: 'INVITE_RESENT',
  ADD_MEMBER: 'ADD_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  ROLE_CHANGE: 'ROLE_CHANGE',
  SUSPEND_MEMBER: 'SUSPEND_MEMBER',
  RESTORE_MEMBER: 'RESTORE_MEMBER',
  SWITCH_TENANT: 'SWITCH_TENANT',
  RESTORE: 'RESTORE',
};

export const TENANT_PERMISSIONS = {
  // Tenant management
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  TENANT_RESTORE: 'tenant:restore',
  
  // Member management
  MEMBER_ADD: 'member:add',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_UPDATE: 'member:update',
  MEMBER_SUSPEND: 'member:suspend',
  MEMBER_RESTORE: 'member:restore',
  
  // Invite management
  INVITE_CREATE: 'invite:create',
  INVITE_LIST: 'invite:list',
  INVITE_CANCEL: 'invite:cancel',
  INVITE_RESEND: 'invite:resend',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
};

export const INVITE_EXPIRY_DAYS = 7;

export const MAX_TENANT_NAME_LENGTH = 100;
export const MIN_TENANT_NAME_LENGTH = 2;
