-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyName" TEXT NOT NULL DEFAULT 'My Family',
    "securityPin" TEXT NOT NULL DEFAULT '111222',
    "defaultBottleUnit" TEXT NOT NULL DEFAULT 'OZ',
    "defaultSolidsUnit" TEXT NOT NULL DEFAULT 'TBSP',
    "defaultHeightUnit" TEXT NOT NULL DEFAULT 'IN',
    "defaultWeightUnit" TEXT NOT NULL DEFAULT 'LB',
    "defaultTempUnit" TEXT NOT NULL DEFAULT 'F',
    "activitySettings" TEXT,
    "enableDebugTimer" BOOLEAN NOT NULL DEFAULT false,
    "enableDebugTimezone" BOOLEAN NOT NULL DEFAULT false,
    "enableSwipeDateChange" BOOLEAN NOT NULL DEFAULT true,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationProvider" TEXT DEFAULT 'HERMES',
    "hermesApiEndpoint" TEXT DEFAULT 'https://hermes.funk-isoft.com/api/sendAlert',
    "hermesApiKey" TEXT,
    "notificationTitle" TEXT NOT NULL DEFAULT 'Warning ‼️',
    "notificationFeedSubtitle" TEXT NOT NULL DEFAULT 'It''s time for feeding ♥️',
    "notificationFeedBody" TEXT NOT NULL DEFAULT 'Baby might be hungry soon, please be ready and prepare in advance~',
    "notificationDiaperSubtitle" TEXT NOT NULL DEFAULT 'It''s time for diary ♥️',
    "notificationDiaperBody" TEXT NOT NULL DEFAULT 'Mom and Dad, please check diary in time for our baby~',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT,
    CONSTRAINT "Settings_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("activitySettings", "createdAt", "defaultBottleUnit", "defaultHeightUnit", "defaultSolidsUnit", "defaultTempUnit", "defaultWeightUnit", "enableDebugTimer", "enableDebugTimezone", "enableSwipeDateChange", "familyId", "familyName", "id", "securityPin", "updatedAt") SELECT "activitySettings", "createdAt", "defaultBottleUnit", "defaultHeightUnit", "defaultSolidsUnit", "defaultTempUnit", "defaultWeightUnit", "enableDebugTimer", "enableDebugTimezone", "enableSwipeDateChange", "familyId", "familyName", "id", "securityPin", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE INDEX "Settings_familyId_idx" ON "Settings"("familyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NotificationLog_babyId_type_sentAt_idx" ON "NotificationLog"("babyId", "type", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_familyId_idx" ON "NotificationLog"("familyId");
