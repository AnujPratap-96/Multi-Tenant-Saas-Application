export const createTenantSlugAndName = (name) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
 name = name.trim();

  if (!name) {
    throw new Error("Tenant name cannot be empty");
  }
  return { slug, name };
}