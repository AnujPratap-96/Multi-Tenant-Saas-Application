import request from 'supertest';
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { app, cleanup, prisma, getCsrf } from '../utils/test-setup.js';
import { generateAuthToken } from '../../src/lib/jwt.js';

describe('Task Management & Cache Consistency', () => {
  let csrf;

  beforeAll(async () => {
    csrf = await getCsrf();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should invalidate project task list cache when a new task is created', async () => {
    // 1. Setup
    const tenant = await prisma.tenant.create({ data: { name: 'Dev Corp', slug: 'dev' } });
    const user = await prisma.user.create({ data: { email: 'dev@dev.com', password: 'hash' } });
    await prisma.tenantUser.create({ data: { tenantId: tenant.id, userId: user.id, role: 'ADMIN' } });
    const project = await prisma.project.create({ data: { name: 'Main App', tenantId: tenant.id, createdById: user.id } });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: user.id, role: 'OWNER' } });

    const { accessToken: token } = await generateAuthToken({ userId: user.id, email: user.email });

    // 2. Fetch list (Warm up Redis cache)
    const listRes1 = await request(app)
      .get(`/api/v1/tasks?projectId=${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', tenant.id);

    expect(listRes1.body.data.tasks.length).toBe(0);

    // 3. Create Task
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', tenant.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({
        projectId: project.id,
        title: 'Fix Login Bug',
        priority: 'HIGH'
      });

    // 4. Fetch list again (Should bypass cache and see new task)
    const listRes2 = await request(app)
      .get(`/api/v1/tasks?projectId=${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', tenant.id);

    expect(listRes2.body.data.tasks.length).toBe(1);
    expect(listRes2.body.data.tasks[0].title).toBe('Fix Login Bug');
  });
});
