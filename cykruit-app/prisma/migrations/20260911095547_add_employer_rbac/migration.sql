-- CreateTable
CREATE TABLE "employer_permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_role_permissions" (
    "id" TEXT NOT NULL,
    "role" "EmployerMemberRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employer_permissions_isActive_idx" ON "employer_permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employer_permissions_module_action_key" ON "employer_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "employer_role_permissions_role_permissionId_key" ON "employer_role_permissions"("role", "permissionId");

-- AddForeignKey
ALTER TABLE "employer_role_permissions" ADD CONSTRAINT "employer_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "employer_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

