import request from 'supertest';
import { describe, it, expect, afterEach } from 'vitest';
import { app, cleanup, prisma } from '../utils/test-setup.js';
import { generateAuthToken } from '../../src/lib/jwt.js';

describe('Multi-Tenant Isolation (E2E)', () => {
  afterEach(async () => {
    await cleanup();
  });

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
});
