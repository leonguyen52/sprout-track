-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "accountId" TEXT,
    "caretakerId" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    CONSTRAINT "Feedback_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Feedback_submittedAt_idx" ON "Feedback"("submittedAt");

-- CreateIndex
CREATE INDEX "Feedback_viewed_idx" ON "Feedback"("viewed");

-- CreateIndex
CREATE INDEX "Feedback_familyId_idx" ON "Feedback"("familyId");

-- CreateIndex
CREATE INDEX "Feedback_accountId_idx" ON "Feedback"("accountId");

-- CreateIndex
CREATE INDEX "Feedback_caretakerId_idx" ON "Feedback"("caretakerId");

-- CreateIndex
CREATE INDEX "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");
