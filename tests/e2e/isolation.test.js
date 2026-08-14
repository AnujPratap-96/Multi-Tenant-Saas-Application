import request from 'supertest';
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { app, cleanup, prisma, getCsrf } from '../utils/test-setup.js';
import { generateAuthToken } from '../../src/lib/jwt.js';

describe('Multi-Tenant Isolation (E2E)', () => {
  let csrf;

  beforeAll(async () => {
    csrf = await getCsrf();
  });

  afterEach(async () => {
    await cleanup();
  });

  const setupUser = async (tenant, email, role = 'ADMIN') => {
    const user = await prisma.user.create({ data: { email, password: 'hash' } });
    await prisma.tenantUser.create({ data: { tenantId: tenant.id, userId: user.id, role } });
    const { accessToken } = await generateAuthToken({ userId: user.id, email: user.email });
    return { user, accessToken };
  };

  it('should strictly prevent cross-tenant project access', async () => {
    // 1. Setup Tenant A & User A
    const tenantA = await prisma.tenant.create({ data: { name: 'Tenant A', slug: 'tenant-a' } });
    const userA = await prisma.user.create({ data: { email: 'userA@a.com', password: 'hash' } });
    await prisma.tenantUser.create({ data: { tenantId: tenantA.id, userId: userA.id, role: 'ADMIN' } });
    const { accessToken: tokenA } = await generateAuthToken({ userId: userA.id, email: userA.email });

    // 2. Setup Tenant B & User B & Project B
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B', slug: 'tenant-b' } });
    const userB = await prisma.user.create({ data: { email: 'userB@b.com', password: 'hash' } });
    await prisma.tenantUser.create({ data: { tenantId: tenantB.id, userId: userB.id, role: 'ADMIN' } });

    const projectB = await prisma.project.create({
      data: { name: 'Secret B', tenantId: tenantB.id, createdById: userB.id }
    });

    // 3. User A tries to access Project B using Tenant A context
    const accessRes1 = await request(app)
      .get(`/api/v1/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Tenant-ID', tenantA.id);

    // Should fail because projectB belongs to tenantB
    expect(accessRes1.statusCode).toBe(404);

    // 4. User A tries to access Project B using Tenant B context
    const accessRes2 = await request(app)
      .get(`/api/v1/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Tenant-ID', tenantB.id);

    // Should fail because User A is not a member of Tenant B
    expect(accessRes2.statusCode).toBe(403);
  });

  it('should block cross-tenant task creation even when the attacker is a project member (S-01)', async () => {
    const tenantA = await prisma.tenant.create({ data: { name: 'Tenant A', slug: 'tenant-a-2' } });
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B', slug: 'tenant-b-2' } });
    const { user: userA, accessToken: tokenA } = await setupUser(tenantA, 'attacker@a.com', 'ADMIN');
    const { user: userB, accessToken: tokenB } = await setupUser(tenantB, 'victim@b.com', 'ADMIN');

    // Project belongs to Tenant B; attacker is ALSO a project member (exploit path)
    const projectB = await prisma.project.create({
      data: { name: 'Victim Project', tenantId: tenantB.id, createdById: userB.id }
    });
    await prisma.projectMember.create({ data: { projectId: projectB.id, userId: userA.id, role: 'MEMBER' } });

    // Attacker calls with their own tenant context (tenant A)
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Tenant-ID', tenantA.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ projectId: projectB.id, title: 'Poisoned Task', priority: 'HIGH' });

    // Project B is not visible in Tenant A -> 404, task must not exist in Tenant B
    expect(createRes.statusCode).toBe(404);

    const poisonedTask = await prisma.task.findFirst({
      where: { tenantId: tenantB.id, title: 'Poisoned Task' }
    });
    expect(poisonedTask).toBeNull();

    // Direct access with the correct tenant context still works
    const okRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Tenant-ID', tenantB.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ projectId: projectB.id, title: 'Legit Task', priority: 'HIGH' });
    expect(okRes.statusCode).toBe(201);
  });

  it('should not leak cached tasks/projects across tenants (S-04)', async () => {
    const tenantA = await prisma.tenant.create({ data: { name: 'Tenant A', slug: 'tenant-a-3' } });
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B', slug: 'tenant-b-3' } });
    const { user: userA, accessToken: tokenA } = await setupUser(tenantA, 'a@a.com', 'ADMIN');
    const { user: userB, accessToken: tokenB } = await setupUser(tenantB, 'b@b.com', 'ADMIN');

    const projectA = await prisma.project.create({
      data: { name: 'Project A', tenantId: tenantA.id, createdById: userA.id }
    });
    await prisma.projectMember.create({ data: { projectId: projectA.id, userId: userA.id, role: 'OWNER' } });
    const task = await prisma.task.create({
      data: { title: 'Secret Task A', tenantId: tenantA.id, projectId: projectA.id, createdById: userA.id }
    });

    // Warm caches from Tenant A's context
    const warm = await request(app)
      .get(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Tenant-ID', tenantA.id);
    expect(warm.statusCode).toBe(200);

    // Now Tenant B (who is not a member of project A) asks for the same task
    const cross = await request(app)
      .get(`/api/v1/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Tenant-ID', tenantB.id);
    expect(cross.statusCode).toBe(404);
  });

  it('should enforce RBAC on task creation for USER role (S-03)', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Tenant', slug: 'tenant-rbac' } });
    const { user: admin, accessToken: adminToken } = await setupUser(tenant, 'admin@rbac.com', 'ADMIN');
    const { user: member, accessToken: memberToken } = await setupUser(tenant, 'user@rbac.com', 'USER');

    const project = await prisma.project.create({
      data: { name: 'Project', tenantId: tenant.id, createdById: admin.id }
    });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: member.id, role: 'MEMBER' } });

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('X-Tenant-ID', tenant.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ projectId: project.id, title: 'No Perm', priority: 'HIGH' });

    expect(res.statusCode).toBe(403);

    // Read is still allowed for USER (view permission)
    const listRes = await request(app)
      .get(`/api/v1/tasks?projectId=${project.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('X-Tenant-ID', tenant.id);
    expect(listRes.statusCode).toBe(200);
  });

  it('should block INVITED members from accessing tenant data (S-10)', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Tenant', slug: 'tenant-invited' } });
    const { user: admin } = await setupUser(tenant, 'admin@invited.com', 'ADMIN');
    const invited = await prisma.user.create({ data: { email: 'invitee@invited.com', password: 'hash' } });
    await prisma.tenantUser.create({
      data: { tenantId: tenant.id, userId: invited.id, role: 'USER', status: 'INVITED' }
    });
    const { accessToken } = await generateAuthToken({ userId: invited.id, email: invited.email });

    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-ID', tenant.id);

    expect(res.statusCode).toBe(403);
  });

  it('should scope user deactivation to the acting tenant (S-02)', async () => {
    const tenantA = await prisma.tenant.create({ data: { name: 'Tenant A', slug: 'tenant-a-4' } });
    const tenantB = await prisma.tenant.create({ data: { name: 'Tenant B', slug: 'tenant-b-4' } });
    const { user: adminA, accessToken: tokenA } = await setupUser(tenantA, 'admina@a.com', 'ADMIN');
    const { user: adminB, accessToken: tokenB } = await setupUser(tenantB, 'adminb@b.com', 'ADMIN');
    const { user: victim } = await setupUser(tenantB, 'victim@b.com', 'USER');

    // Admin A (different tenant) tries to deactivate victim in tenant B
    const crossRes = await request(app)
      .delete(`/api/v1/users/${victim.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Tenant-ID', tenantA.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie);
    expect(crossRes.statusCode).toBe(404);

    // Victim's membership in tenant B is untouched
    const membership = await prisma.tenantUser.findFirst({
      where: { tenantId: tenantB.id, userId: victim.id }
    });
    expect(membership.status).toBe('ACTIVE');

    // Admin B (same tenant) can deactivate
    const okRes = await request(app)
      .delete(`/api/v1/users/${victim.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Tenant-ID', tenantB.id)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie);
    expect(okRes.statusCode).toBe(200);

    const after = await prisma.tenantUser.findFirst({
      where: { tenantId: tenantB.id, userId: victim.id }
    });
    expect(after.status).toBe('REMOVED');
  });
});
