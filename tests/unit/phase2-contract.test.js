import { describe, it, expect, vi } from 'vitest';
import { validate } from '../../src/middlewares/validate.middleware.js';
import { taskParamsSchema } from '../../src/modules/tasks/schemas/task.schema.js';
import { updateUserRole } from '../../src/modules/rbac/services/rbac.service.js';

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    tenantUser: {
      update: vi.fn().mockResolvedValue({ id: 'membership', role: 'MANAGER' }),
    },
  },
}));

vi.mock('../../src/modules/tenant/redis/tenant.redis.js', () => ({
  invalidateMembershipCache: vi.fn(),
}));

describe('Phase 2 - Validation contract 400 (D-12)', () => {
  it('validate middleware throws ApiError 400 for invalid task params', () => {
    const req = {
      body: {},
      params: { id: 'not-a-uuid' },
      query: {},
      path: '/tasks/not-a-uuid',
      method: 'GET',
    };
    const next = vi.fn();

    expect(() => validate(taskParamsSchema)(req, {}, next)).toThrowError(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validate middleware passes valid params through', () => {
    const req = {
      body: {},
      params: { id: '3f6c3f0e-8c1a-4f7e-9a2b-6d5c4b3a2f10' },
      query: {},
      path: '/tasks/3f6c3f0e-8c1a-4f7e-9a2b-6d5c4b3a2f10',
      method: 'GET',
    };
    const next = vi.fn();

    validate(taskParamsSchema)(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Phase 2 - Enum-validated roles (D-13/S-24)', () => {
  it('rejects custom role names with 400', async () => {
    await expect(
      updateUserRole('tenant-1', 'user-1', 'CUSTOM-ROLE')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts enum roles and invalidates membership cache', async () => {
    const prismaMock = (await import('../../src/lib/prisma.js')).default;
    const tenantRedis = await import('../../src/modules/tenant/redis/tenant.redis.js');

    await updateUserRole('tenant-1', 'user-1', 'MANAGER');

    expect(prismaMock.tenantUser.update).toHaveBeenCalledWith({
      where: { tenantId_userId: { tenantId: 'tenant-1', userId: 'user-1' } },
      data: { role: 'MANAGER' },
    });
    expect(tenantRedis.invalidateMembershipCache).toHaveBeenCalledWith('tenant-1', 'user-1');
  });
});
