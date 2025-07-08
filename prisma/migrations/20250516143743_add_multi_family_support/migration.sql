-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "familyId" TEXT NOT NULL,
    "caretakerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("familyId", "caretakerId"),
    CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FamilyMember_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Baby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "gender" TEXT,
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "feedWarningTime" TEXT NOT NULL DEFAULT '03:00',
    "diaperWarningTime" TEXT NOT NULL DEFAULT '02:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    CONSTRAINT "Baby_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Baby" ("birthDate", "createdAt", "deletedAt", "diaperWarningTime", "feedWarningTime", "firstName", "gender", "id", "inactive", "lastName", "updatedAt") SELECT "birthDate", "createdAt", "deletedAt", "diaperWarningTime", "feedWarningTime", "firstName", "gender", "id", "inactive", "lastName", "updatedAt" FROM "Baby";
DROP TABLE "Baby";
ALTER TABLE "new_Baby" RENAME TO "Baby";
CREATE INDEX "Baby_birthDate_idx" ON "Baby"("birthDate");
CREATE INDEX "Baby_deletedAt_idx" ON "Baby"("deletedAt");
CREATE INDEX "Baby_familyId_idx" ON "Baby"("familyId");
CREATE TABLE "new_BathLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "soapUsed" BOOLEAN NOT NULL DEFAULT true,
    "shampooUsed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "BathLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BathLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BathLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BathLog" ("babyId", "caretakerId", "createdAt", "deletedAt", "id", "notes", "shampooUsed", "soapUsed", "time", "updatedAt") SELECT "babyId", "caretakerId", "createdAt", "deletedAt", "id", "notes", "shampooUsed", "soapUsed", "time", "updatedAt" FROM "BathLog";
DROP TABLE "BathLog";
ALTER TABLE "new_BathLog" RENAME TO "BathLog";
CREATE INDEX "BathLog_time_idx" ON "BathLog"("time");
CREATE INDEX "BathLog_babyId_idx" ON "BathLog"("babyId");
CREATE INDEX "BathLog_caretakerId_idx" ON "BathLog"("caretakerId");
CREATE INDEX "BathLog_deletedAt_idx" ON "BathLog"("deletedAt");
CREATE INDEX "BathLog_familyId_idx" ON "BathLog"("familyId");
CREATE TABLE "new_CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "color" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" TEXT,
    "recurrenceEnd" DATETIME,
    "customRecurrence" TEXT,
    "reminderTime" INTEGER,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    CONSTRAINT "CalendarEvent_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("allDay", "color", "createdAt", "customRecurrence", "deletedAt", "description", "endTime", "id", "location", "notificationSent", "recurrenceEnd", "recurrencePattern", "recurring", "reminderTime", "startTime", "title", "type", "updatedAt") SELECT "allDay", "color", "createdAt", "customRecurrence", "deletedAt", "description", "endTime", "id", "location", "notificationSent", "recurrenceEnd", "recurrencePattern", "recurring", "reminderTime", "startTime", "title", "type", "updatedAt" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");
CREATE INDEX "CalendarEvent_endTime_idx" ON "CalendarEvent"("endTime");
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");
CREATE INDEX "CalendarEvent_recurring_idx" ON "CalendarEvent"("recurring");
CREATE INDEX "CalendarEvent_deletedAt_idx" ON "CalendarEvent"("deletedAt");
CREATE INDEX "CalendarEvent_familyId_idx" ON "CalendarEvent"("familyId");
CREATE TABLE "new_Caretaker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "securityPin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    CONSTRAINT "Caretaker_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Caretaker" ("createdAt", "deletedAt", "id", "inactive", "loginId", "name", "role", "securityPin", "type", "updatedAt") SELECT "createdAt", "deletedAt", "id", "inactive", "loginId", "name", "role", "securityPin", "type", "updatedAt" FROM "Caretaker";
DROP TABLE "Caretaker";
ALTER TABLE "new_Caretaker" RENAME TO "Caretaker";
CREATE INDEX "Caretaker_deletedAt_idx" ON "Caretaker"("deletedAt");
CREATE INDEX "Caretaker_familyId_idx" ON "Caretaker"("familyId");
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    CONSTRAINT "Contact_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("address", "createdAt", "deletedAt", "email", "id", "name", "notes", "phone", "role", "updatedAt") SELECT "address", "createdAt", "deletedAt", "email", "id", "name", "notes", "phone", "role", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_role_idx" ON "Contact"("role");
CREATE INDEX "Contact_deletedAt_idx" ON "Contact"("deletedAt");
CREATE INDEX "Contact_familyId_idx" ON "Contact"("familyId");
CREATE TABLE "new_DiaperLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "condition" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "DiaperLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DiaperLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiaperLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DiaperLog" ("babyId", "caretakerId", "color", "condition", "createdAt", "deletedAt", "id", "time", "type", "updatedAt") SELECT "babyId", "caretakerId", "color", "condition", "createdAt", "deletedAt", "id", "time", "type", "updatedAt" FROM "DiaperLog";
DROP TABLE "DiaperLog";
ALTER TABLE "new_DiaperLog" RENAME TO "DiaperLog";
CREATE INDEX "DiaperLog_time_idx" ON "DiaperLog"("time");
CREATE INDEX "DiaperLog_babyId_idx" ON "DiaperLog"("babyId");
CREATE INDEX "DiaperLog_caretakerId_idx" ON "DiaperLog"("caretakerId");
CREATE INDEX "DiaperLog_deletedAt_idx" ON "DiaperLog"("deletedAt");
CREATE INDEX "DiaperLog_familyId_idx" ON "DiaperLog"("familyId");
CREATE TABLE "new_FeedLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "feedDuration" INTEGER,
    "type" TEXT NOT NULL,
    "amount" REAL,
    "unitAbbr" TEXT,
    "side" TEXT,
    "food" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "FeedLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FeedLog" ("amount", "babyId", "caretakerId", "createdAt", "deletedAt", "endTime", "feedDuration", "food", "id", "side", "startTime", "time", "type", "unitAbbr", "updatedAt") SELECT "amount", "babyId", "caretakerId", "createdAt", "deletedAt", "endTime", "feedDuration", "food", "id", "side", "startTime", "time", "type", "unitAbbr", "updatedAt" FROM "FeedLog";
DROP TABLE "FeedLog";
ALTER TABLE "new_FeedLog" RENAME TO "FeedLog";
CREATE INDEX "FeedLog_time_idx" ON "FeedLog"("time");
CREATE INDEX "FeedLog_startTime_idx" ON "FeedLog"("startTime");
CREATE INDEX "FeedLog_endTime_idx" ON "FeedLog"("endTime");
CREATE INDEX "FeedLog_babyId_idx" ON "FeedLog"("babyId");
CREATE INDEX "FeedLog_caretakerId_idx" ON "FeedLog"("caretakerId");
CREATE INDEX "FeedLog_unitAbbr_idx" ON "FeedLog"("unitAbbr");
CREATE INDEX "FeedLog_deletedAt_idx" ON "FeedLog"("deletedAt");
CREATE INDEX "FeedLog_familyId_idx" ON "FeedLog"("familyId");
CREATE TABLE "new_Measurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "Measurement_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Measurement_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Measurement_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Measurement" ("babyId", "caretakerId", "createdAt", "date", "deletedAt", "id", "notes", "type", "unit", "updatedAt", "value") SELECT "babyId", "caretakerId", "createdAt", "date", "deletedAt", "id", "notes", "type", "unit", "updatedAt", "value" FROM "Measurement";
DROP TABLE "Measurement";
ALTER TABLE "new_Measurement" RENAME TO "Measurement";
CREATE INDEX "Measurement_date_idx" ON "Measurement"("date");
CREATE INDEX "Measurement_type_idx" ON "Measurement"("type");
CREATE INDEX "Measurement_babyId_idx" ON "Measurement"("babyId");
CREATE INDEX "Measurement_caretakerId_idx" ON "Measurement"("caretakerId");
CREATE INDEX "Measurement_deletedAt_idx" ON "Measurement"("deletedAt");
CREATE INDEX "Measurement_familyId_idx" ON "Measurement"("familyId");
CREATE TABLE "new_Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "typicalDoseSize" REAL,
    "unitAbbr" TEXT,
    "doseMinTime" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    CONSTRAINT "Medicine_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Medicine_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Medicine" ("active", "createdAt", "deletedAt", "doseMinTime", "id", "name", "notes", "typicalDoseSize", "unitAbbr", "updatedAt") SELECT "active", "createdAt", "deletedAt", "doseMinTime", "id", "name", "notes", "typicalDoseSize", "unitAbbr", "updatedAt" FROM "Medicine";
DROP TABLE "Medicine";
ALTER TABLE "new_Medicine" RENAME TO "Medicine";
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");
CREATE INDEX "Medicine_active_idx" ON "Medicine"("active");
CREATE INDEX "Medicine_unitAbbr_idx" ON "Medicine"("unitAbbr");
CREATE INDEX "Medicine_deletedAt_idx" ON "Medicine"("deletedAt");
CREATE INDEX "Medicine_familyId_idx" ON "Medicine"("familyId");
CREATE TABLE "new_MedicineLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "doseAmount" REAL NOT NULL,
    "unitAbbr" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "medicineId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "MedicineLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MedicineLog" ("babyId", "caretakerId", "createdAt", "deletedAt", "doseAmount", "id", "medicineId", "notes", "time", "unitAbbr", "updatedAt") SELECT "babyId", "caretakerId", "createdAt", "deletedAt", "doseAmount", "id", "medicineId", "notes", "time", "unitAbbr", "updatedAt" FROM "MedicineLog";
DROP TABLE "MedicineLog";
ALTER TABLE "new_MedicineLog" RENAME TO "MedicineLog";
CREATE INDEX "MedicineLog_time_idx" ON "MedicineLog"("time");
CREATE INDEX "MedicineLog_medicineId_idx" ON "MedicineLog"("medicineId");
CREATE INDEX "MedicineLog_babyId_idx" ON "MedicineLog"("babyId");
CREATE INDEX "MedicineLog_caretakerId_idx" ON "MedicineLog"("caretakerId");
CREATE INDEX "MedicineLog_unitAbbr_idx" ON "MedicineLog"("unitAbbr");
CREATE INDEX "MedicineLog_deletedAt_idx" ON "MedicineLog"("deletedAt");
CREATE INDEX "MedicineLog_familyId_idx" ON "MedicineLog"("familyId");
CREATE TABLE "new_Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "ageInDays" INTEGER,
    "photo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "Milestone_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Milestone_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Milestone_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Milestone" ("ageInDays", "babyId", "caretakerId", "category", "createdAt", "date", "deletedAt", "description", "id", "photo", "title", "updatedAt") SELECT "ageInDays", "babyId", "caretakerId", "category", "createdAt", "date", "deletedAt", "description", "id", "photo", "title", "updatedAt" FROM "Milestone";
DROP TABLE "Milestone";
ALTER TABLE "new_Milestone" RENAME TO "Milestone";
CREATE INDEX "Milestone_date_idx" ON "Milestone"("date");
CREATE INDEX "Milestone_babyId_idx" ON "Milestone"("babyId");
CREATE INDEX "Milestone_caretakerId_idx" ON "Milestone"("caretakerId");
CREATE INDEX "Milestone_deletedAt_idx" ON "Milestone"("deletedAt");
CREATE INDEX "Milestone_familyId_idx" ON "Milestone"("familyId");
CREATE TABLE "new_MoodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "mood" TEXT NOT NULL,
    "intensity" INTEGER DEFAULT 3,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "MoodLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MoodLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MoodLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MoodLog" ("babyId", "caretakerId", "createdAt", "deletedAt", "duration", "id", "intensity", "mood", "time", "updatedAt") SELECT "babyId", "caretakerId", "createdAt", "deletedAt", "duration", "id", "intensity", "mood", "time", "updatedAt" FROM "MoodLog";
DROP TABLE "MoodLog";
ALTER TABLE "new_MoodLog" RENAME TO "MoodLog";
CREATE INDEX "MoodLog_time_idx" ON "MoodLog"("time");
CREATE INDEX "MoodLog_babyId_idx" ON "MoodLog"("babyId");
CREATE INDEX "MoodLog_caretakerId_idx" ON "MoodLog"("caretakerId");
CREATE INDEX "MoodLog_deletedAt_idx" ON "MoodLog"("deletedAt");
CREATE INDEX "MoodLog_familyId_idx" ON "MoodLog"("familyId");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "Note_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("babyId", "caretakerId", "category", "content", "createdAt", "deletedAt", "id", "time", "updatedAt") SELECT "babyId", "caretakerId", "category", "content", "createdAt", "deletedAt", "id", "time", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_time_idx" ON "Note"("time");
CREATE INDEX "Note_babyId_idx" ON "Note"("babyId");
CREATE INDEX "Note_caretakerId_idx" ON "Note"("caretakerId");
CREATE INDEX "Note_deletedAt_idx" ON "Note"("deletedAt");
CREATE INDEX "Note_familyId_idx" ON "Note"("familyId");
CREATE TABLE "new_PlayLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "activities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "PlayLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlayLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlayLog" ("activities", "babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "location", "startTime", "type", "updatedAt") SELECT "activities", "babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "location", "startTime", "type", "updatedAt" FROM "PlayLog";
DROP TABLE "PlayLog";
ALTER TABLE "new_PlayLog" RENAME TO "PlayLog";
CREATE INDEX "PlayLog_startTime_idx" ON "PlayLog"("startTime");
CREATE INDEX "PlayLog_endTime_idx" ON "PlayLog"("endTime");
CREATE INDEX "PlayLog_babyId_idx" ON "PlayLog"("babyId");
CREATE INDEX "PlayLog_caretakerId_idx" ON "PlayLog"("caretakerId");
CREATE INDEX "PlayLog_deletedAt_idx" ON "PlayLog"("deletedAt");
CREATE INDEX "PlayLog_familyId_idx" ON "PlayLog"("familyId");
CREATE TABLE "new_PumpLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "leftAmount" REAL,
    "rightAmount" REAL,
    "totalAmount" REAL,
    "unitAbbr" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "PumpLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PumpLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PumpLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PumpLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PumpLog" ("babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "leftAmount", "notes", "rightAmount", "startTime", "totalAmount", "unitAbbr", "updatedAt") SELECT "babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "leftAmount", "notes", "rightAmount", "startTime", "totalAmount", "unitAbbr", "updatedAt" FROM "PumpLog";
DROP TABLE "PumpLog";
ALTER TABLE "new_PumpLog" RENAME TO "PumpLog";
CREATE INDEX "PumpLog_startTime_idx" ON "PumpLog"("startTime");
CREATE INDEX "PumpLog_endTime_idx" ON "PumpLog"("endTime");
CREATE INDEX "PumpLog_babyId_idx" ON "PumpLog"("babyId");
CREATE INDEX "PumpLog_caretakerId_idx" ON "PumpLog"("caretakerId");
CREATE INDEX "PumpLog_unitAbbr_idx" ON "PumpLog"("unitAbbr");
CREATE INDEX "PumpLog_deletedAt_idx" ON "PumpLog"("deletedAt");
CREATE INDEX "PumpLog_familyId_idx" ON "PumpLog"("familyId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT,
    CONSTRAINT "Settings_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("activitySettings", "createdAt", "defaultBottleUnit", "defaultHeightUnit", "defaultSolidsUnit", "defaultTempUnit", "defaultWeightUnit", "enableDebugTimer", "enableDebugTimezone", "familyName", "id", "securityPin", "updatedAt") SELECT "activitySettings", "createdAt", "defaultBottleUnit", "defaultHeightUnit", "defaultSolidsUnit", "defaultTempUnit", "defaultWeightUnit", "enableDebugTimer", "enableDebugTimezone", "familyName", "id", "securityPin", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE INDEX "Settings_familyId_idx" ON "Settings"("familyId");
CREATE TABLE "new_SleepLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "quality" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "familyId" TEXT,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "SleepLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SleepLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SleepLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SleepLog" ("babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "location", "quality", "startTime", "type", "updatedAt") SELECT "babyId", "caretakerId", "createdAt", "deletedAt", "duration", "endTime", "id", "location", "quality", "startTime", "type", "updatedAt" FROM "SleepLog";
DROP TABLE "SleepLog";
ALTER TABLE "new_SleepLog" RENAME TO "SleepLog";
CREATE INDEX "SleepLog_startTime_idx" ON "SleepLog"("startTime");
CREATE INDEX "SleepLog_endTime_idx" ON "SleepLog"("endTime");
CREATE INDEX "SleepLog_babyId_idx" ON "SleepLog"("babyId");
CREATE INDEX "SleepLog_caretakerId_idx" ON "SleepLog"("caretakerId");
CREATE INDEX "SleepLog_deletedAt_idx" ON "SleepLog"("deletedAt");
CREATE INDEX "SleepLog_familyId_idx" ON "SleepLog"("familyId");
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitAbbr" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "activityTypes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "familyId" TEXT,
    CONSTRAINT "Unit_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("activityTypes", "createdAt", "id", "unitAbbr", "unitName", "updatedAt") SELECT "activityTypes", "createdAt", "id", "unitAbbr", "unitName", "updatedAt" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE UNIQUE INDEX "Unit_unitAbbr_key" ON "Unit"("unitAbbr");
CREATE INDEX "Unit_unitAbbr_idx" ON "Unit"("unitAbbr");
CREATE INDEX "Unit_familyId_idx" ON "Unit"("familyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Family_slug_key" ON "Family"("slug");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "FamilyMember_caretakerId_idx" ON "FamilyMember"("caretakerId");
