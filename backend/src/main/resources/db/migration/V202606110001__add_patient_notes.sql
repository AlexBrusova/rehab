-- Add notes column to Patient (free-text staff notes, editable from profile).
ALTER TABLE "Patient" ADD COLUMN "notes" TEXT;
