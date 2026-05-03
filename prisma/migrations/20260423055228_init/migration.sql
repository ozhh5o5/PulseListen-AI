-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "lastCrawledAt" DATETIME,
    CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "authorHandle" TEXT,
    "rawText" TEXT NOT NULL,
    "redactedText" TEXT,
    "piiFlags" TEXT,
    "postedAt" DATETIME,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signalType" TEXT,
    "sentiment" TEXT,
    "sentimentConfidence" REAL,
    "entities" TEXT,
    "isAdverseEvent" BOOLEAN NOT NULL DEFAULT false,
    "reasoning" TEXT,
    CONSTRAINT "Mention_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Mention_projectId_postedAt_idx" ON "Mention"("projectId", "postedAt");

-- CreateIndex
CREATE INDEX "Mention_projectId_signalType_idx" ON "Mention"("projectId", "signalType");
