import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { redisClient } from '../src/config/redis.js';
import { generateAuthToken } from '../src/lib/jwt.js';
import { API_PREFIX } from '../src/config/version.js';

async function runAudit() {
  console.log('🚀 Starting Comprehensive End-to-End System Audit...\n');

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('✓ Redis connected');
    } catch (e) {
      console.warn('⚠️ Redis connection skipped:', e.message);
    }
  }

  // 1. Fetch CSRF token
  const csrfRes = await request(app).get(`${API_PREFIX}/csrf-token`);
  const csrfToken = csrfRes.body?.data?.token;
  const csrfCookie = (csrfRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log('✓ CSRF Token & Cookie acquired');

  // 2. Identify Admin User and Tenant
  const adminMembership = await prisma.tenantUser.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE' },
    include: { user: true, tenant: true },
  });

  if (!adminMembership) {
    throw new Error('No active ADMIN found in database for testing');
  }

  const { user, tenant } = adminMembership;
  const tenantId = tenant.id;
  const { accessToken } = await generateAuthToken({ userId: user.id, email: user.email });
  console.log(`✓ Authenticated as ADMIN: ${user.email} (Tenant: ${tenant.name} [${tenantId}])\n`);

  const client = {
    get: (url) =>
      request(app)
        .get(`${API_PREFIX}${url}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', csrfCookie),
    post: (url, body) =>
      request(app)
        .post(`${API_PREFIX}${url}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', csrfCookie)
        .send(body),
    patch: (url, body) =>
      request(app)
        .patch(`${API_PREFIX}${url}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', csrfCookie)
        .send(body),
    delete: (url) =>
      request(app)
        .delete(`${API_PREFIX}${url}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .set('x-csrf-token', csrfToken)
        .set('Cookie', csrfCookie),
  };

  const results = [];

  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASSED' });
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAILED', error: err.message });
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  };

  console.log('--- MODULE 1: Health & System ---');
  await test('GET /health', async () => {
    const res = await request(app).get(`${API_PREFIX}/health`);
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n--- MODULE 2: User Profile & Self-Service ---');
  await test('GET /users/me', async () => {
    const res = await client.get('/users/me');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test('PATCH /users/me (update bio & displayName)', async () => {
    const res = await client.patch('/users/me', {
      displayName: user.displayName || 'Lead Architect',
      bio: 'Multi-tenant cloud administrator',
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test('GET /users/me/sessions', async () => {
    const res = await client.get('/users/me/sessions');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n--- MODULE 3: Tenant & Membership ---');
  await test('GET /tenants/my', async () => {
    const res = await client.get('/tenants/my');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test(`GET /tenants/${tenantId}`, async () => {
    const res = await client.get(`/tenants/${tenantId}`);
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test(`GET /tenants/${tenantId}/members`, async () => {
    const res = await client.get(`/tenants/${tenantId}/members`);
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test(`GET /tenants/${tenantId}/invites`, async () => {
    const res = await client.get(`/tenants/${tenantId}/invites`);
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n--- MODULE 4: RBAC & Permissions ---');
  await test('GET /rbac/my', async () => {
    const res = await client.get('/rbac/my');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (!res.body.data?.permissions?.length) throw new Error('No permissions returned');
  });

  await test('GET /rbac/roles', async () => {
    const res = await client.get('/rbac/roles');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (res.body.data?.length < 3) throw new Error(`Expected at least 3 seeded roles, got ${res.body.data?.length}`);
  });

  await test('GET /rbac/permissions', async () => {
    const res = await client.get('/rbac/permissions');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (res.body.data?.length < 20) throw new Error(`Expected at least 20 seeded permissions, got ${res.body.data?.length}`);
  });

  await test('GET /rbac/users', async () => {
    const res = await client.get('/rbac/users');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n--- MODULE 5: Departments ---');
  let deptId = null;
  await test('GET /departments', async () => {
    const res = await client.get('/departments');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (res.body.data?.departments?.length > 0) {
      deptId = res.body.data.departments[0].id;
    }
  });

  if (!deptId) {
    await test('POST /departments (create initial department)', async () => {
      const res = await client.post('/departments', {
        name: 'Core Platform Engineering',
        description: 'Infrastructure and scalable backend systems',
        managerId: user.id,
      });
      if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      deptId = res.body.data.id;
    });
  }

  if (deptId) {
    await test(`GET /departments/${deptId}`, async () => {
      const res = await client.get(`/departments/${deptId}`);
      if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    });

    await test(`GET /departments/${deptId}/members`, async () => {
      const res = await client.get(`/departments/${deptId}/members`);
      if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    });
  }

  console.log('\n--- MODULE 6: Projects ---');
  let projectId = null;
  await test('GET /projects', async () => {
    const res = await client.get('/projects');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (res.body.data?.projects?.length > 0) {
      projectId = res.body.data.projects[0].id;
    }
  });

  if (!projectId && deptId) {
    await test('POST /projects (create initial project)', async () => {
      const res = await client.post('/projects', {
        name: 'Enterprise Cloud Portal',
        description: 'Multi-tenant cloud management suite',
        departmentIds: [deptId],
      });
      if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      projectId = res.body.data.id;
    });
  }

  if (projectId) {
    await test(`GET /projects/${projectId}`, async () => {
      const res = await client.get(`/projects/${projectId}`);
      if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    });

    await test(`PATCH /projects/${projectId}`, async () => {
      const res = await client.patch(`/projects/${projectId}`, {
        description: 'Updated enterprise cloud management suite description',
      });
      if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    });
  }

  console.log('\n--- MODULE 7: Tasks ---');
  let taskId = null;
  if (projectId) {
    await test(`GET /tasks?projectId=${projectId}`, async () => {
      const res = await client.get(`/tasks?projectId=${projectId}`);
      if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      if (res.body.data?.tasks?.length > 0) {
        taskId = res.body.data.tasks[0].id;
      }
    });

    await test('POST /tasks (create task)', async () => {
      const res = await client.post('/tasks', {
        projectId,
        title: 'Implement OAuth Token Refresh Pipeline',
        description: 'Verify and persist rotating refresh tokens',
        status: 'TODO',
        priority: 'HIGH',
      });
      if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      taskId = res.body.data.id;
    });

    if (taskId) {
      await test(`GET /tasks/${taskId}`, async () => {
        const res = await client.get(`/tasks/${taskId}`);
        if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      });

      await test(`PATCH /tasks/${taskId} (update status to IN_PROGRESS)`, async () => {
        const res = await client.patch(`/tasks/${taskId}`, {
          status: 'IN_PROGRESS',
        });
        if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      });

      await test(`POST /tasks/${taskId}/comments`, async () => {
        const res = await client.post(`/tasks/${taskId}/comments`, {
          comment: 'Initial automated unit test verification comment.',
        });
        if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      });

      await test(`GET /tasks/${taskId}/comments`, async () => {
        const res = await client.get(`/tasks/${taskId}/comments`);
        if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
      });
    }
  }

  console.log('\n--- MODULE 8: Audit Logs ---');
  await test('GET /audit-logs?limit=10', async () => {
    const res = await client.get('/audit-logs?limit=10');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test('GET /audit-logs/export (CSV export)', async () => {
    const res = await client.get('/audit-logs/export');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (!res.text.includes('Timestamp') || !res.text.includes('Action')) {
      throw new Error('CSV header missing in export');
    }
  });

  console.log('\n--- MODULE 9: Notifications ---');
  await test('GET /notifications', async () => {
    const res = await client.get('/notifications');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test('GET /notifications/unread-count', async () => {
    const res = await client.get('/notifications/unread-count');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n--- MODULE 10: Users Administration ---');
  await test('GET /users (tenant users list)', async () => {
    const res = await client.get('/users?page=1&limit=10');
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  await test(`GET /users/${user.id}`, async () => {
    const res = await client.get(`/users/${user.id}`);
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
  });

  console.log('\n=======================================');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`E2E AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED across 10 modules.`);
  console.log('=======================================\n');

  await prisma.$disconnect();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(failed > 0 ? 1 : 0);
}

runAudit().catch(async (e) => {
  console.error('Fatal audit failure:', e);
  await prisma.$disconnect();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  process.exit(1);
});
