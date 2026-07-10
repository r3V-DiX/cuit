-- AlterTable
ALTER TABLE "admin_audit_logs" ADD COLUMN     "module" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "result" TEXT NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "job_seeker_profiles" ADD COLUMN     "professionalEmail" TEXT;

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_rbac_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_assignments" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "roleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permission_overrides" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grant" BOOLEAN NOT NULL,
    "grantedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_permissions_isActive_idx" ON "admin_permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_module_action_key" ON "admin_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "admin_rbac_roles_name_key" ON "admin_rbac_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_permissions_roleId_permissionId_key" ON "admin_role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "admin_role_assignments_adminId_idx" ON "admin_role_assignments"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_assignments_adminId_roleId_key" ON "admin_role_assignments"("adminId", "roleId");

-- CreateIndex
CREATE INDEX "admin_permission_overrides_adminId_idx" ON "admin_permission_overrides"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permission_overrides_adminId_permissionId_key" ON "admin_permission_overrides"("adminId", "permissionId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_module_idx" ON "admin_audit_logs"("module");

-- CreateIndex
CREATE INDEX "admin_audit_logs_riskLevel_idx" ON "admin_audit_logs"("riskLevel");

-- CreateIndex
CREATE INDEX "admin_audit_logs_result_idx" ON "admin_audit_logs"("result");

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
