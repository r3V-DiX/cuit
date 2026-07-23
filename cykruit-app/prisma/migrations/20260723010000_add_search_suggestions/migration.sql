-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('ROLE', 'SKILL', 'COMPANY');

-- CreateTable
CREATE TABLE "search_suggestions" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "type" "SuggestionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_suggestions_type_isActive_idx" ON "search_suggestions"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "search_suggestions_text_type_key" ON "search_suggestions"("text", "type");

-- AddForeignKey
ALTER TABLE "search_suggestions" ADD CONSTRAINT "search_suggestions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
