-- Add optimistic locking version columns for @Version JPA fields.
-- Required by feat/resilience-stateless: Patient, Room, User entities.
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Room"    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "User"    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
