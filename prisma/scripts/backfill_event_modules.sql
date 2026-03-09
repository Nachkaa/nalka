-- prisma/scripts/backfill_event_modules.sql
-- Backfill EventModule + Settings (idempotent)
-- Does NOT depend on dropped Event columns (hasBringSection/settings/etc)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create OVERVIEW for every event
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT
  gen_random_uuid()::text,
  now(),
  now(),
  e."id",
  'OVERVIEW'::"EventModuleKey",
  TRUE,
  0
FROM "Event" e
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = 'OVERVIEW'
);

-- Create GIFTS based on existing GiftLists
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT
  gen_random_uuid()::text,
  now(),
  now(),
  e."id",
  'GIFTS'::"EventModuleKey",
  EXISTS (SELECT 1 FROM "GiftList" gl WHERE gl."eventId" = e."id"),
  1
FROM "Event" e
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = 'GIFTS'
);

-- Create SECRET_SANTA based on presence of Secret Santa data (fallback disabled if none)
-- If you don't have a dedicated table yet, default to FALSE unless you can infer it.
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT
  gen_random_uuid()::text,
  now(),
  now(),
  e."id",
  'SECRET_SANTA'::"EventModuleKey",
  FALSE,
  2
FROM "Event" e
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = 'SECRET_SANTA'
);

-- Create POTLUCK based on bring items
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT
  gen_random_uuid()::text,
  now(),
  now(),
  e."id",
  'POTLUCK'::"EventModuleKey",
  EXISTS (SELECT 1 FROM "EventBringItem" bi WHERE bi."eventId" = e."id"),
  3
FROM "Event" e
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = 'POTLUCK'
);

-- Always-on modules (adjust if you want them off by default)
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT gen_random_uuid()::text, now(), now(), e."id", k.key, TRUE, k.pos
FROM "Event" e
CROSS JOIN (VALUES
  ('TIMELINE'::"EventModuleKey", 4),
  ('EXPENSES'::"EventModuleKey", 5),
  ('CHAT'::"EventModuleKey", 7)
) AS k(key, pos)
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = k.key
);

-- POLLS based on EventPoll rows
INSERT INTO "EventModule" ("id","createdAt","updatedAt","eventId","key","enabled","position")
SELECT
  gen_random_uuid()::text,
  now(),
  now(),
  e."id",
  'POLLS'::"EventModuleKey",
  EXISTS (SELECT 1 FROM "EventPoll" p WHERE p."eventId" = e."id"),
  6
FROM "Event" e
WHERE NOT EXISTS (
  SELECT 1 FROM "EventModule" em
  WHERE em."eventId" = e."id" AND em."key" = 'POLLS'
);

-- Settings: create rows if missing (safe joins)

INSERT INTO "EventOverviewSettings" ("id","eventModuleId","rsvpRequired")
SELECT gen_random_uuid()::text, em."id", TRUE
FROM "EventModule" em
WHERE em."key"='OVERVIEW'
AND NOT EXISTS (SELECT 1 FROM "EventOverviewSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventGiftsSettings" ("id","eventModuleId","isNoSpoil","isAnonReservations","isSecondHandOk","isHandmadeOk","budgetCapCents")
SELECT gen_random_uuid()::text, em."id", TRUE, TRUE, FALSE, FALSE, NULL
FROM "EventModule" em
WHERE em."key"='GIFTS'
AND NOT EXISTS (SELECT 1 FROM "EventGiftsSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventSecretSantaSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='SECRET_SANTA'
AND NOT EXISTS (SELECT 1 FROM "EventSecretSantaSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventPotluckSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='POTLUCK'
AND NOT EXISTS (SELECT 1 FROM "EventPotluckSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventTimelineSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='TIMELINE'
AND NOT EXISTS (SELECT 1 FROM "EventTimelineSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventExpensesSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='EXPENSES'
AND NOT EXISTS (SELECT 1 FROM "EventExpensesSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventPollsSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='POLLS'
AND NOT EXISTS (SELECT 1 FROM "EventPollsSettings" s WHERE s."eventModuleId"=em."id");

INSERT INTO "EventChatSettings" ("id","eventModuleId")
SELECT gen_random_uuid()::text, em."id"
FROM "EventModule" em
WHERE em."key"='CHAT'
AND NOT EXISTS (SELECT 1 FROM "EventChatSettings" s WHERE s."eventModuleId"=em."id");
