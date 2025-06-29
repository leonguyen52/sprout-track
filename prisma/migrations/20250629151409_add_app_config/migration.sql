-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminPass" TEXT NOT NULL,
    "rootDomain" TEXT NOT NULL,
    "enableHttps" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
