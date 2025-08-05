-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "betaparticipant" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" DATETIME,
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
INSERT INTO "new_Account" ("betaparticipant", "caretakerId", "createdAt", "email", "familyId", "firstName", "id", "lastName", "password", "passwordResetExpires", "passwordResetToken", "planExpires", "planType", "provider", "providerId", "stripeCustomerId", "subscriptionId", "trialEnds", "updatedAt", "verificationToken", "verified") SELECT "betaparticipant", "caretakerId", "createdAt", "email", "familyId", "firstName", "id", "lastName", "password", "passwordResetExpires", "passwordResetToken", "planExpires", "planType", "provider", "providerId", "stripeCustomerId", "subscriptionId", "trialEnds", "updatedAt", "verificationToken", "verified" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
CREATE UNIQUE INDEX "Account_verificationToken_key" ON "Account"("verificationToken");
CREATE UNIQUE INDEX "Account_passwordResetToken_key" ON "Account"("passwordResetToken");
CREATE UNIQUE INDEX "Account_familyId_key" ON "Account"("familyId");
CREATE UNIQUE INDEX "Account_caretakerId_key" ON "Account"("caretakerId");
CREATE INDEX "Account_email_idx" ON "Account"("email");
CREATE INDEX "Account_verified_idx" ON "Account"("verified");
CREATE INDEX "Account_verificationToken_idx" ON "Account"("verificationToken");
CREATE INDEX "Account_passwordResetToken_idx" ON "Account"("passwordResetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
