/*
  Warnings:

  - You are about to drop the column `otp` on the `EmailOtp` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `EmailOtp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,purpose]` on the table `EmailOtp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeHash` to the `EmailOtp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `EmailOtp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('SIGNUP', 'LOGIN', 'PASSWORD_RESET');

-- DropIndex
DROP INDEX "EmailOtp_email_key";

-- AlterTable
ALTER TABLE "EmailOtp" DROP COLUMN "otp",
DROP COLUMN "verified",
ADD COLUMN     "codeHash" TEXT NOT NULL,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EmailOtp_expiresAt_idx" ON "EmailOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOtp_email_purpose_key" ON "EmailOtp"("email", "purpose");
