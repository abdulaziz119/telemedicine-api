CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_doctor_schedule_no_overlap"
EXCLUDE USING GIST (
  "doctor_id" WITH =,
  tsrange("starts_at", "ends_at", '[)') WITH &&
)
WHERE ("status" = 'SCHEDULED'::"AppointmentStatus" AND "deleted_at" IS NULL);

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_patient_schedule_no_overlap"
EXCLUDE USING GIST (
  "patient_id" WITH =,
  tsrange("starts_at", "ends_at", '[)') WITH &&
)
WHERE ("status" = 'SCHEDULED'::"AppointmentStatus" AND "deleted_at" IS NULL);
