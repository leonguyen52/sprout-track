/*
  Warnings:

  - Added the required column `password` to the `FamilySetup` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FamilySetup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "familyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilySetup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Caretaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilySetup_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FamilySetup" ("createdAt", "createdBy", "expiresAt", "familyId", "id", "token", "updatedAt", "password") SELECT "createdAt", "createdBy", "expiresAt", "familyId", "id", "token", "updatedAt", 'setup123' FROM "FamilySetup";
DROP TABLE "FamilySetup";
ALTER TABLE "new_FamilySetup" RENAME TO "FamilySetup";
CREATE UNIQUE INDEX "FamilySetup_token_key" ON "FamilySetup"("token");
CREATE UNIQUE INDEX "FamilySetup_familyId_key" ON "FamilySetup"("familyId");
CREATE INDEX "FamilySetup_createdBy_idx" ON "FamilySetup"("createdBy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
