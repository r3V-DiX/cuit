-- AlterEnum
ALTER TYPE "TokenType" ADD VALUE 'OTP_LOGIN';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
