-- CreateTable
CREATE TABLE "BetaSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT true,
    "optedOutAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'coming-soon',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BetaCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'NOTIFICATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "BetaCampaignEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    CONSTRAINT "BetaCampaignEmail_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BetaCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BetaCampaignEmail_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "BetaSubscriber" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaSubscriber_email_key" ON "BetaSubscriber"("email");

-- CreateIndex
CREATE INDEX "BetaSubscriber_email_idx" ON "BetaSubscriber"("email");

-- CreateIndex
CREATE INDEX "BetaSubscriber_isOptedIn_idx" ON "BetaSubscriber"("isOptedIn");

-- CreateIndex
CREATE INDEX "BetaSubscriber_source_idx" ON "BetaSubscriber"("source");

-- CreateIndex
CREATE INDEX "BetaSubscriber_createdAt_idx" ON "BetaSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "BetaSubscriber_deletedAt_idx" ON "BetaSubscriber"("deletedAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_type_idx" ON "BetaCampaign"("type");

-- CreateIndex
CREATE INDEX "BetaCampaign_isActive_idx" ON "BetaCampaign"("isActive");

-- CreateIndex
CREATE INDEX "BetaCampaign_scheduledAt_idx" ON "BetaCampaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_createdAt_idx" ON "BetaCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "BetaCampaign_deletedAt_idx" ON "BetaCampaign"("deletedAt");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_sentAt_idx" ON "BetaCampaignEmail"("sentAt");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_status_idx" ON "BetaCampaignEmail"("status");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_campaignId_idx" ON "BetaCampaignEmail"("campaignId");

-- CreateIndex
CREATE INDEX "BetaCampaignEmail_subscriberId_idx" ON "BetaCampaignEmail"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "BetaCampaignEmail_campaignId_subscriberId_key" ON "BetaCampaignEmail"("campaignId", "subscriberId");
