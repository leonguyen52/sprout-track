-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "typicalDoseSize" REAL,
    "unitAbbr" TEXT,
    "doseMinTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Medicine_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicineLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL,
    "doseAmount" REAL NOT NULL,
    "unitAbbr" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "medicineId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "caretakerId" TEXT,
    CONSTRAINT "MedicineLog_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "Caretaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MedicineLog_unitAbbr_fkey" FOREIGN KEY ("unitAbbr") REFERENCES "Unit" ("unitAbbr") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactMedicine" (
    "contactId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,

    PRIMARY KEY ("contactId", "medicineId"),
    CONSTRAINT "ContactMedicine_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- CreateIndex
CREATE INDEX "Medicine_active_idx" ON "Medicine"("active");

-- CreateIndex
CREATE INDEX "Medicine_unitAbbr_idx" ON "Medicine"("unitAbbr");

-- CreateIndex
CREATE INDEX "Medicine_deletedAt_idx" ON "Medicine"("deletedAt");

-- CreateIndex
CREATE INDEX "MedicineLog_time_idx" ON "MedicineLog"("time");

-- CreateIndex
CREATE INDEX "MedicineLog_medicineId_idx" ON "MedicineLog"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineLog_babyId_idx" ON "MedicineLog"("babyId");

-- CreateIndex
CREATE INDEX "MedicineLog_caretakerId_idx" ON "MedicineLog"("caretakerId");

-- CreateIndex
CREATE INDEX "MedicineLog_unitAbbr_idx" ON "MedicineLog"("unitAbbr");

-- CreateIndex
CREATE INDEX "MedicineLog_deletedAt_idx" ON "MedicineLog"("deletedAt");

-- CreateIndex
CREATE INDEX "ContactMedicine_contactId_idx" ON "ContactMedicine"("contactId");

-- CreateIndex
CREATE INDEX "ContactMedicine_medicineId_idx" ON "ContactMedicine"("medicineId");
