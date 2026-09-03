-- AlterTable
-- No backfill needed — the Event table has zero existing rows.
ALTER TABLE "Event" ADD COLUMN     "slug" TEXT NOT NULL;
ALTER TABLE "Event" ADD COLUMN     "content" TEXT;
ALTER TABLE "Event" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
