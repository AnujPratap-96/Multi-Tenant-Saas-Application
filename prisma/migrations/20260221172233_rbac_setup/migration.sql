/*
  Warnings:

  - A unique constraint covering the columns `[resource,action]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "TenantUserPermission_tenantId_permissionId_idx" ON "TenantUserPermission"("tenantId", "permissionId");
