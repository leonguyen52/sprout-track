-- CreateTable
CREATE TABLE "DemoTracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "sourceFamilyId" TEXT NOT NULL,
    "dateRangeStart" DATETIME NOT NULL,
    "dateRangeEnd" DATETIME NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoTracker_familyId_key" ON "DemoTracker"("familyId");

-- CreateIndex
CREATE INDEX "DemoTracker_generatedAt_idx" ON "DemoTracker"("generatedAt");

-- CreateIndex
CREATE INDEX "DemoTracker_lastAccessedAt_idx" ON "DemoTracker"("lastAccessedAt");
