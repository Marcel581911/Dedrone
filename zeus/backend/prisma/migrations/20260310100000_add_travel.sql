-- Travel module: Trip, TripEvent, FlightTracking, POI

CREATE TABLE "Trip" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "destination" TEXT NOT NULL DEFAULT '',
  "homeAirport" TEXT NOT NULL DEFAULT 'SFO',
  "startDate"   DATETIME NOT NULL,
  "endDate"     DATETIME NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'upcoming',
  "coverEmoji"  TEXT NOT NULL DEFAULT '✈️',
  "notes"       TEXT NOT NULL DEFAULT '',
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TripEvent" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "tripId"          TEXT NOT NULL,
  "type"            TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "startTime"       DATETIME NOT NULL,
  "endTime"         DATETIME,
  "location"        TEXT NOT NULL DEFAULT '',
  "address"         TEXT NOT NULL DEFAULT '',
  "bookingRef"      TEXT NOT NULL DEFAULT '',
  "confirmationNum" TEXT NOT NULL DEFAULT '',
  "notes"           TEXT NOT NULL DEFAULT '',
  "flightNumber"    TEXT NOT NULL DEFAULT '',
  "airline"         TEXT NOT NULL DEFAULT '',
  "fromAirport"     TEXT NOT NULL DEFAULT '',
  "toAirport"       TEXT NOT NULL DEFAULT '',
  "terminal"        TEXT NOT NULL DEFAULT '',
  "gate"            TEXT NOT NULL DEFAULT '',
  "flightStatus"    TEXT NOT NULL DEFAULT 'scheduled',
  "delayMinutes"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FlightTracking" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "eventId"        TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL DEFAULT '',
  "active"         INTEGER NOT NULL DEFAULT 1,
  "lastChecked"    DATETIME,
  "lastStatus"     TEXT NOT NULL DEFAULT '',
  "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlightTracking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TripEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FlightTracking_eventId_key" ON "FlightTracking"("eventId");

CREATE TABLE "POI" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "tripId"    TEXT,
  "name"      TEXT NOT NULL,
  "address"   TEXT NOT NULL DEFAULT '',
  "city"      TEXT NOT NULL DEFAULT '',
  "country"   TEXT NOT NULL DEFAULT '',
  "category"  TEXT NOT NULL DEFAULT '',
  "notes"     TEXT NOT NULL DEFAULT '',
  "visitedAt" DATETIME,
  "lat"       REAL,
  "lng"       REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "POI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "POI_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
