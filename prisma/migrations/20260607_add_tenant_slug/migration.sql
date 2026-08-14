-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant" ("slug");
