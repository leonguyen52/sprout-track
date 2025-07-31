-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerType" TEXT NOT NULL DEFAULT 'SENDGRID',
    "sendGridApiKey" TEXT,
    "smtp2goApiKey" TEXT,
    "serverAddress" TEXT,
    "port" INTEGER,
    "username" TEXT,
    "password" TEXT,
    "enableTls" BOOLEAN NOT NULL DEFAULT true,
    "allowSelfSignedCert" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
