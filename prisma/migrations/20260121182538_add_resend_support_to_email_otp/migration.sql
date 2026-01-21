-- DropIndex
DROP INDEX "EmailOtp_email_purpose_key";

-- AlterTable
ALTER TABLE "EmailOtp" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "EmailOtp_email_purpose_idx" ON "EmailOtp"("email", "purpose");
