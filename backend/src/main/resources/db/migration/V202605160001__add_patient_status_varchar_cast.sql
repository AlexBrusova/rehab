-- Allow JPA (Hibernate) to compare varchar parameters against the PatientStatus PG enum column
-- without explicit CAST. PostgreSQL rejects `"PatientStatus" = character varying` by default.
CREATE CAST (character varying AS "PatientStatus") WITH INOUT AS IMPLICIT;
