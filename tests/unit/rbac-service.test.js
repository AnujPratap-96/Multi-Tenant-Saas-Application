import { describe, it, expect, vi } from 'vitest';
import * as rbacService from '../../src/modules/rbac/services/rbac.service.js';
import * as rbacRepository from '../../src/modules/rbac/repositories/rbac.repository.js';

// Mock the repository
vi.mock('../../src/modules/rbac/repositories/rbac.repository.js');

describe('RBAC Service (Unit)', () => {
  it('should allow ADMIN role by default', async () => {
    const result = await rbacService.checkPermission('t1', 'u1', 'ADMIN', 'PROJECT', 'DELETE');
    expect(result).toBe(true);
  });

  it('should call repository for other roles', async () => {
    rbacRepository.checkUserPermission.mockResolvedValue(true);
    
    const result = await rbacService.checkPermission('t1', 'u1', 'USER', 'PROJECT', 'CREATE');
    
    expect(rbacRepository.checkUserPermission).toHaveBeenCalledWith('t1', 'u1', 'USER', 'PROJECT', 'CREATE');
    expect(result).toBe(true);
  });

  it('should return false if repository returns false', async () => {
    rbacRepository.checkUserPermission.mockResolvedValue(false);
    
    const result = await rbacService.checkPermission('t1', 'u1', 'USER', 'PROJECT', 'DELETE');
    
    expect(result).toBe(false);
  });
});
