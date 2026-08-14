-- Phase 2 P1 fixes (D-7, D-8, D-9, D-14, D-1)
-- 1. User.password nullable (D-8 - Google passwordless accounts)
-- 2. AuthSession.refreshTokenHash unique index (D-9/B-07)
-- 3. TenantInvite table + backfill from TenantUser INVITED rows (D-7/S-11)
-- 4. TenantSettings table (D-14/S-18)
-- 5. AuditLog createdAt + tenantId/createdAt indexes (D-1)

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex (D-9)
CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");

-- CreateEnum
CREATE TYPE "TenantInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable (D-7)
CREATE TABLE "TenantInvite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "invitedById" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "TenantInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    CONSTRAINT "TenantInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvite_tenantId_email_key" ON "TenantInvite"("tenantId", "email");
CREATE INDEX "TenantInvite_email_idx" ON "TenantInvite"("email");

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable (D-14)
CREATE TABLE "TenantSettings" (
    "tenantId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("tenantId")
);

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (D-1)
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- Backfill: existing TenantUser INVITED rows -> TenantInvite (D-7)
-- tokenHash has no DB equivalent for legacy rows (tokens live in Redis);
-- placeholder marks them as migrated so listing/cancel/resend work from the table.
INSERT INTO "TenantInvite" ("id", "tenantId", "email", "role", "invitedById", "tokenHash", "status", "expiresAt", "createdAt")
SELECT gen_random_uuid()::text, tu."tenantId", u."email", tu."role", tu."invitedById", 'migrated-from-tenant-user', 'PENDING', NOW() + INTERVAL '7 days', tu."joinedAt"
FROM "TenantUser" tu
JOIN "User" u ON u."id" = tu."userId"
WHERE tu."status" = 'INVITED'
ON CONFLICT ("tenantId", "email") DO NOTHING;
