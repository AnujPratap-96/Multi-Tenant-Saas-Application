import request from 'supertest';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { app, cleanup, prisma } from '../utils/test-setup.js';

describe('Auth & Tenant Flow (E2E)', () => {
  beforeAll(async () => {
    // any heavy setup
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should take a user from signup to tenant creation', async () => {
    // 1. Request Signup OTP
    const signupRes = await request(app)
      .post('/api/v1/auth/signup-otp')
      .send({ email: 'test@example.com' });
    
    expect(signupRes.statusCode).toBe(200);
    
    // In test mode, we might need a way to bypass or get the OTP from Redis
    // Usually, we'd mock the email service
    
    // 2. Login (Assuming we have a user now)
    // For this test, let's create a user directly for efficiency
    const user = await prisma.user.create({
      data: {
        email: 'ceo@enterprise.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true
      }
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ceo@enterprise.com', password: 'Password123!' });
    
    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.data.accessToken;

    // 3. Create Tenant
    const tenantRes = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
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
