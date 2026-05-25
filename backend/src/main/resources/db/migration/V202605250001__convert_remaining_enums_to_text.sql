-- Convert remaining Prisma-generated PostgreSQL native enum columns to TEXT.
-- Same root cause as V202605160001 (PatientStatus): Hibernate binds VARCHAR
-- parameters but PG rejects "EnumType = character varying" without explicit cast.
-- Fix: convert all enum columns to TEXT, then drop the unused enum types.

-- Phone.status (PhoneStatus)
ALTER TABLE "Phone" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Phone" ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE "Phone" ALTER COLUMN status SET DEFAULT 'active';

-- Shift.status (ShiftStatus)
ALTER TABLE "Shift" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Shift" ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE "Shift" ALTER COLUMN status SET DEFAULT 'pending';

-- Consequence.status (ConsequenceStatus)
ALTER TABLE "Consequence" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Consequence" ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE "Consequence" ALTER COLUMN status SET DEFAULT 'pending';

-- Absence.status (AbsenceStatus)
ALTER TABLE "Absence" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Absence" ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE "Absence" ALTER COLUMN status SET DEFAULT 'pending';

-- Finance.type (FinanceType)
ALTER TABLE "Finance" ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- CashboxEntry.type (FinanceType - shared enum, convert before dropping)
ALTER TABLE "CashboxEntry" ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- User.role (Role)
ALTER TABLE "User" ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- Drop enum types (safe after all columns converted)
DROP TYPE IF EXISTS "PhoneStatus";
DROP TYPE IF EXISTS "ShiftStatus";
DROP TYPE IF EXISTS "ConsequenceStatus";
DROP TYPE IF EXISTS "AbsenceStatus";
DROP TYPE IF EXISTS "FinanceType";
DROP TYPE IF EXISTS "Role";
