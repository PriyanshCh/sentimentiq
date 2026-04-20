-- ─────────────────────────────────────────────────────────────────────────────
--  SentimentIQ — PostgreSQL bootstrap script
--  Runs once on first container start (via docker-entrypoint-initdb.d).
--  The database and user are already created by POSTGRES_* env vars;
--  this script sets up the schema and grants.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure UUID extension is available (used by JPA entities)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant all privileges to application user (already owns the DB, but be explicit)
GRANT ALL PRIVILEGES ON DATABASE sentimentiq TO sentimentiq_user;

-- ── Schema tables are managed by Hibernate ddl-auto=update ────────────────────
-- No manual DDL needed; Spring Boot creates tables on first startup.
-- This file exists for extensions, seed data, or index hints.

-- ── Optional: create a read-only reporting role ───────────────────────────────
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sentimentiq_reader') THEN
--     CREATE ROLE sentimentiq_reader WITH LOGIN PASSWORD 'readerpass';
--     GRANT CONNECT ON DATABASE sentimentiq TO sentimentiq_reader;
--     GRANT USAGE ON SCHEMA public TO sentimentiq_reader;
--     GRANT SELECT ON ALL TABLES IN SCHEMA public TO sentimentiq_reader;
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sentimentiq_reader;
--   END IF;
-- END
-- $$;
