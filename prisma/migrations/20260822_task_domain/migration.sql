-- Task domain extensions (Phase 2): time tracking, deadline history, activity, notifications, comments, profile

-- Extend TaskStatus enum
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Task: planning + lifecycle columns
ALTER TABLE "Task" ADD COLUMN "initialDueDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "estimatedMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN "blockedReason" TEXT;
ALTER TABLE "Task" ADD COLUMN "cancelledReason" TEXT;
ALTER TABLE "Task" ADD COLUMN "reopenedAt" TIMESTAMP(3);

-- TaskAssignee: who assigned + reason
ALTER TABLE "TaskAssignee" ADD COLUMN "assignedById" TEXT;
ALTER TABLE "TaskAssignee" ADD COLUMN "reason" TEXT;
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TaskComment: threading + edit tracking
ALTER TABLE "TaskComment" ADD COLUMN "parentId" TEXT;
ALTER TABLE "TaskComment" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaskComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TaskComment_parentId_idx" ON "TaskComment"("parentId");

-- TaskCommentMention
CREATE TABLE "TaskCommentMention" (
    "taskCommentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TaskCommentMention_pkey" PRIMARY KEY ("taskCommentId","userId")
);
CREATE INDEX "TaskCommentMention_userId_idx" ON "TaskCommentMention"("userId");
ALTER TABLE "TaskCommentMention" ADD CONSTRAINT "TaskCommentMention_taskCommentId_fkey" FOREIGN KEY ("taskCommentId") REFERENCES "TaskComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCommentMention" ADD CONSTRAINT "TaskCommentMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TimeEntry
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TimeEntry_tenantId_idx" ON "TimeEntry"("tenantId");
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskDeadlineHistory
CREATE TABLE "TaskDeadlineHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "newDueDate" TIMESTAMP(3),
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDeadlineHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaskDeadlineHistory_taskId_idx" ON "TaskDeadlineHistory"("taskId");
ALTER TABLE "TaskDeadlineHistory" ADD CONSTRAINT "TaskDeadlineHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDeadlineHistory" ADD CONSTRAINT "TaskDeadlineHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDeadlineHistory" ADD CONSTRAINT "TaskDeadlineHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TaskActivity
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaskActivity_tenantId_idx" ON "TaskActivity"("tenantId");
CREATE INDEX "TaskActivity_taskId_idx" ON "TaskActivity"("taskId");
CREATE INDEX "TaskActivity_createdAt_idx" ON "TaskActivity"("createdAt");
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_tenantId_userId_idx" ON "Notification"("tenantId","userId");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId","readAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User profile columns
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT;
ALTER TABLE "User" ADD COLUMN "locale" TEXT;

-- TenantUser org-specific job title
ALTER TABLE "TenantUser" ADD COLUMN "jobTitle" TEXT;

-- TaskType creator
ALTER TABLE "TaskType" ADD COLUMN "createdById" TEXT;
ALTER TABLE "TaskType" ADD CONSTRAINT "TaskType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
