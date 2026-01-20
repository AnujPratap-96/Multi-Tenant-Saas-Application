/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `EmailOtp` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "EmailOtp_email_idx";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB;

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOtp_email_key" ON "EmailOtp"("email");
