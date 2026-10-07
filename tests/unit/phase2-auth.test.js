import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithEmailPasswordService } from '../../src/modules/auth/services/login.service.js';
import { generateOtpService } from '../../src/modules/auth/services/generate-otp.service.js';
import * as userRepository from '../../src/modules/users/user.repository.js';
import { OTP_PURPOSE } from '../../src/modules/auth/constants/auth.constants.js';

vi.mock('../../src/modules/users/user.repository.js', () => ({
  findUserByEmail: vi.fn(),
  updateLastLogin: vi.fn(),
}));

describe('Phase 2 - Passwordless accounts (D-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects email+password login for Google-created users with 401', async () => {
    userRepository.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'google@example.com',
      password: null,
      isActive: true,
    });

    await expect(
      loginWithEmailPasswordService('google@example.com', 'whatever', '1.2.3.4', 'test-agent')
    ).rejects.toMatchObject({ statusCode: 401, message: expect.stringContaining('Google') });
  });

  it('rejects login for unknown users with generic 401', async () => {
    userRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      loginWithEmailPasswordService('nobody@example.com', 'password123', '1.2.3.4', 'test-agent')
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('Phase 2 - OTP enumeration guard (D-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SIGNUP for an existing email rejects with 400', async () => {
    userRepository.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'exists@example.com' });

    await expect(
      generateOtpService({
        email: 'exists@example.com',
        requestId: 'req-1',
        purpose: OTP_PURPOSE.SIGNUP,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('LOGIN for an unknown email rejects with 404', async () => {
    userRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      generateOtpService({
        email: 'ghost@example.com',
        requestId: 'req-2',
        purpose: OTP_PURPOSE.LOGIN,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('FORGOT_PASSWORD for an unknown email rejects with 404', async () => {
    userRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      generateOtpService({
        email: 'ghost@example.com',
        requestId: 'req-3',
        purpose: OTP_PURPOSE.FORGOT_PASSWORD,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
