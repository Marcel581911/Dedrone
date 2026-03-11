-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "city" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "assistantName" TEXT NOT NULL DEFAULT 'Gulli',
    "assistantPersonality" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdBy" TEXT NOT NULL,
    "usedBy" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- AlterTable Agent
ALTER TABLE "Agent" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- AlterTable Ticket
ALTER TABLE "Ticket" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- AlterTable Note
ALTER TABLE "Note" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- AlterTable Reminder
ALTER TABLE "Reminder" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- AlterTable CalendarEvent
ALTER TABLE "CalendarEvent" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- AlterTable Notification
ALTER TABLE "Notification" ADD COLUMN "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
