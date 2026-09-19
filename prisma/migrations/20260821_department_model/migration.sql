-- Department model + task types + resource/department junctions (Phase 1)

CREATE TYPE "DepartmentRole" AS ENUM ('MANAGER', 'LEAD', 'MEMBER');

CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepartmentMember" (
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DepartmentRole" NOT NULL DEFAULT 'MEMBER',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    CONSTRAINT "DepartmentMember_pkey" PRIMARY KEY ("departmentId","userId")
);

CREATE TABLE "TaskType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectDepartment" (
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "ProjectDepartment_pkey" PRIMARY KEY ("projectId","departmentId")
);

CREATE TABLE "TaskDepartment" (
    "taskId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "TaskDepartment_pkey" PRIMARY KEY ("taskId","departmentId")
);

-- Indexes
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");
CREATE INDEX "Department_managerId_idx" ON "Department"("managerId");
CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId","name");
CREATE INDEX "DepartmentMember_userId_idx" ON "DepartmentMember"("userId");
CREATE INDEX "TaskType_tenantId_idx" ON "TaskType"("tenantId");
CREATE UNIQUE INDEX "TaskType_tenantId_name_key" ON "TaskType"("tenantId","name");
CREATE INDEX "ProjectDepartment_departmentId_idx" ON "ProjectDepartment"("departmentId");
CREATE INDEX "TaskDepartment_departmentId_idx" ON "TaskDepartment"("departmentId");

-- Alter TenantUser: home department
ALTER TABLE "TenantUser" ADD COLUMN "homeDepartmentId" TEXT;
CREATE INDEX "TenantUser_homeDepartmentId_idx" ON "TenantUser"("homeDepartmentId");

-- Alter Task: task type
ALTER TABLE "Task" ADD COLUMN "taskTypeId" TEXT;

-- Foreign keys
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DepartmentMember" ADD CONSTRAINT "DepartmentMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentMember" ADD CONSTRAINT "DepartmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskType" ADD CONSTRAINT "TaskType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskType" ADD CONSTRAINT "TaskType_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectDepartment" ADD CONSTRAINT "ProjectDepartment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDepartment" ADD CONSTRAINT "ProjectDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskDepartment" ADD CONSTRAINT "TaskDepartment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDepartment" ADD CONSTRAINT "TaskDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_homeDepartmentId_fkey" FOREIGN KEY ("homeDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "TaskType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend AuditEntity enum for new audited entities
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'DEPARTMENT';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'TASK_TYPE';
