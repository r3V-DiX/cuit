-- CreateEnum
CREATE TYPE "AdminInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "admin_invites" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" UUID NOT NULL,
    "roleId" TEXT,
    "status" "AdminInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_email_key" ON "admin_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_token_key" ON "admin_invites"("token");

-- CreateIndex
CREATE INDEX "admin_invites_token_idx" ON "admin_invites"("token");

-- CreateIndex
CREATE INDEX "admin_invites_status_idx" ON "admin_invites"("status");

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
