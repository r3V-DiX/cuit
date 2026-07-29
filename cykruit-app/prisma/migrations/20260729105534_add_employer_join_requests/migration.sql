-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "employer_join_requests" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employer_join_requests_employerId_status_idx" ON "employer_join_requests"("employerId", "status");

-- CreateIndex
CREATE INDEX "employer_join_requests_requesterId_idx" ON "employer_join_requests"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_join_requests_employerId_requesterId_key" ON "employer_join_requests"("employerId", "requesterId");

-- AddForeignKey
ALTER TABLE "employer_join_requests" ADD CONSTRAINT "employer_join_requests_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_join_requests" ADD CONSTRAINT "employer_join_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
