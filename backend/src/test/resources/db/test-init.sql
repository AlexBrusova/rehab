CREATE TYPE "PatientStatus" AS ENUM ('active', 'archived');
CREATE CAST (character varying AS "PatientStatus") WITH INOUT AS IMPLICIT;
