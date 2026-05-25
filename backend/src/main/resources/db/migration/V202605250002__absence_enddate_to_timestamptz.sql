-- Change Absence.endDate from TEXT to TIMESTAMPTZ.
-- Old values are DD/MM/YYYY strings; convert where possible, fall back to NOW().
ALTER TABLE "Absence" ALTER COLUMN "endDate" TYPE TIMESTAMPTZ
  USING CASE
    WHEN "endDate" ~ '^\d{2}/\d{2}/\d{4}$'
      THEN to_timestamp("endDate", 'DD/MM/YYYY')
    WHEN "endDate" ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}'
      THEN "endDate"::TIMESTAMPTZ
    ELSE NOW()
  END;
