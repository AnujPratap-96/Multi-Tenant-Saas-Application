-- Create Roles table (avoiding conflict with Role enum type)
CREATE TABLE "Roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- Insert system roles
INSERT INTO "Roles" ("id", "name", "description", "isSystem", "createdAt", "updatedAt") VALUES
('sys-admin', 'ADMIN', 'Full access to all resources', true, NOW(), NOW()),
('sys-manager', 'MANAGER', 'Can manage projects and tasks', true, NOW(), NOW()),
('sys-user', 'USER', 'Basic view-only access', true, NOW(), NOW());

-- Add roleId column to RolePermission (nullable initially)
ALTER TABLE "RolePermission" ADD COLUMN "roleId" TEXT;

-- Update roleId based on role enum value
UPDATE "RolePermission" SET "roleId" = (
    CASE "role"
        WHEN 'ADMIN' THEN 'sys-admin'
        WHEN 'MANAGER' THEN 'sys-manager'
        WHEN 'USER' THEN 'sys-user'
    END
);

-- Make roleId NOT NULL
ALTER TABLE "RolePermission" ALTER COLUMN "roleId" SET NOT NULL;

-- Drop old unique index and role column
DROP INDEX IF EXISTS "RolePermission_role_permissionId_key";
ALTER TABLE "RolePermission" DROP COLUMN "role";

-- Create new unique index
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- Add foreign key
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
