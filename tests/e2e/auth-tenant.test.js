import request from 'supertest';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { app, cleanup, prisma, getCsrf } from '../utils/test-setup.js';

describe('Auth & Tenant Flow (E2E)', () => {
  let csrf;

  beforeAll(async () => {
    csrf = await getCsrf();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should take a user from signup to tenant creation', async () => {
    // 1. Request Signup OTP
    const signupRes = await request(app)
      .post('/api/v1/auth/signup-otp')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ email: 'test@example.com' });

    expect(signupRes.statusCode).toBe(200);

    // 2. Create a user directly for efficiency
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'ceo@enterprise.com',
        password: passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true
      }
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ email: 'ceo@enterprise.com', password: 'Password123!' });

    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.data.accessToken;

    // 3. Create Tenant
    const tenantRes = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ name: 'Enterprise Corp', plan: 'PRO' });

    expect(tenantRes.statusCode).toBe(201);
    expect(tenantRes.body.data.name).toBe('Enterprise Corp');
    const tenantId = tenantRes.body.data.id;

    // 4. Verify Role as Owner
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: user.id, tenantId }
    });
    expect(membership.role).toBe('ADMIN');
  });
});
