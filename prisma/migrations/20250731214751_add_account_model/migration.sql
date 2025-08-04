/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `Caretaker` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountId]` on the table `Family` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Caretaker" ADD COLUMN "accountId" TEXT;

-- AlterTable
ALTER TABLE "Family" ADD COLUMN "accountId" TEXT;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "provider" TEXT,
    "providerId" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "planType" TEXT,
    "planExpires" DATETIME,
    "trialEnds" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT,
    "caretakerId" TEXT,
    CONSTRAINT "Account_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_verificationToken_key" ON "Account"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_passwordResetToken_key" ON "Account"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_familyId_key" ON "Account"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_caretakerId_key" ON "Account"("caretakerId");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Account_verified_idx" ON "Account"("verified");

-- CreateIndex
CREATE INDEX "Account_verificationToken_idx" ON "Account"("verificationToken");

-- CreateIndex
CREATE INDEX "Account_passwordResetToken_idx" ON "Account"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Caretaker_accountId_key" ON "Caretaker"("accountId");

-- CreateIndex
CREATE INDEX "Caretaker_accountId_idx" ON "Caretaker"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_accountId_key" ON "Family"("accountId");
