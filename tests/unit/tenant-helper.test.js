import { describe, it, expect } from 'vitest';
import { createTenantSlugAndName } from '../../src/modules/tenant/utils/tenant-helper.js';

describe('Tenant Helper (Unit)', () => {
  it('should generate a correct slug and trim name', () => {
    const input = '  My Awesome Startup!  ';
    const result = createTenantSlugAndName(input);

    expect(result.name).toBe('My Awesome Startup!');
    expect(result.slug).toBe('my-awesome-startup');
  });

  it('should handle special characters for slugs', () => {
    const input = 'Tech & Design 2024';
    const result = createTenantSlugAndName(input);

    expect(result.slug).toBe('tech-design-2024');
  });

  it('should throw error for empty name', () => {
    expect(() => createTenantSlugAndName('')).toThrow('Tenant name cannot be empty');
  });
});
