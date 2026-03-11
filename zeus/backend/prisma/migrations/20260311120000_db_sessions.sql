-- Persistent DB sessions (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS "Session" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "token"     TEXT NOT NULL UNIQUE,
  "userId"    TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
