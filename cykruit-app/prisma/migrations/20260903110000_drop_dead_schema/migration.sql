-- Drop child tables first (FK dependents), before their parents
DROP TABLE "role_permissions";
DROP TABLE "user_role_assignments";
DROP TABLE "user_permission_overrides";

-- Now the parents they referenced
DROP TABLE "permissions";
DROP TABLE "rbac_roles";

-- Standalone tables, any order
DROP TABLE "notification_queue";
DROP TABLE "company_profile_views";
DROP TABLE "resume_embeddings";

-- Column drops (Postgres automatically drops any single-column index on the
-- dropped column, e.g. messages_status_idx — no separate DROP INDEX needed)
ALTER TABLE "messages" DROP COLUMN "status";
ALTER TABLE "conversations" DROP COLUMN "type";

-- Now safe to drop the enum types (no column references left)
DROP TYPE "MessageStatus";
DROP TYPE "ConversationType";
DROP TYPE "QuestionType";
