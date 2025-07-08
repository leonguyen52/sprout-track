/*
  Warnings:

  - You are about to drop the column `familyId` on the `Unit` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "FamilySetup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "familyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilySetup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Caretaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilySetup_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitAbbr" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "activityTypes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Unit" ("activityTypes", "createdAt", "id", "unitAbbr", "unitName", "updatedAt") SELECT "activityTypes", "createdAt", "id", "unitAbbr", "unitName", "updatedAt" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE UNIQUE INDEX "Unit_unitAbbr_key" ON "Unit"("unitAbbr");
CREATE INDEX "Unit_unitAbbr_idx" ON "Unit"("unitAbbr");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FamilySetup_token_key" ON "FamilySetup"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySetup_familyId_key" ON "FamilySetup"("familyId");

-- CreateIndex
CREATE INDEX "FamilySetup_createdBy_idx" ON "FamilySetup"("createdBy");
