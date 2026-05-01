import { v4 as uuid } from 'uuid';

export const createFakeUser = (overrides = {}) => ({
  id: uuid(),
  email: `user-${uuid().substring(0, 8)}@example.com`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  emailVerified: true,
  ...overrides,
});

export const createFakeTenant = (overrides = {}) => ({
  id: uuid(),
  name: 'Test Tenant',
  slug: `test-tenant-${uuid().substring(0, 8)}`,
  plan: 'FREE',
  ...overrides,
});

export const createFakeProject = (tenantId, userId, overrides = {}) => ({
  id: uuid(),
  name: 'Test Project',
  description: 'A test project description',
  tenantId,
  createdById: userId,
  ...overrides,
});

export const createFakeTask = (projectId, tenantId, userId, overrides = {}) => ({
  id: uuid(),
  title: 'Test Task',
  description: 'Task description',
  status: 'TODO',
  priority: 'MEDIUM',
  projectId,
  tenantId,
  createdById: userId,
  ...overrides,
});
