-- AlterTable
ALTER TABLE "EmailOtp" ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "token" TEXT,
ALTER COLUMN "lastSentAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "EmailOtp_id_token_idx" ON "EmailOtp"("id", "token");
