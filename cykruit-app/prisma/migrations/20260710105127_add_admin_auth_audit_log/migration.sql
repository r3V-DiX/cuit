-- CreateTable
CREATE TABLE "admin_auth_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "adminId" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_adminId_idx" ON "admin_auth_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_action_idx" ON "admin_auth_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_createdAt_idx" ON "admin_auth_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_status_idx" ON "admin_auth_audit_logs"("status");

-- AddForeignKey
ALTER TABLE "admin_auth_audit_logs" ADD CONSTRAINT "admin_auth_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
