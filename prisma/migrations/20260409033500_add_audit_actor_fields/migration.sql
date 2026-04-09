ALTER TABLE "users"
ADD COLUMN "created_by_id" TEXT,
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "doctor_profiles"
ADD COLUMN "created_by_id" TEXT,
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "appointments"
ADD COLUMN "created_by_id" TEXT,
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "prescriptions"
ADD COLUMN "created_by_id" TEXT,
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "prescription_items"
ADD COLUMN "created_by_id" TEXT,
ADD COLUMN "updated_by_id" TEXT;

ALTER TABLE "users"
ADD CONSTRAINT "users_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
ADD CONSTRAINT "users_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_profiles"
ADD CONSTRAINT "doctor_profiles_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_profiles"
ADD CONSTRAINT "doctor_profiles_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescriptions"
ADD CONSTRAINT "prescriptions_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescriptions"
ADD CONSTRAINT "prescriptions_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescription_items"
ADD CONSTRAINT "prescription_items_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescription_items"
ADD CONSTRAINT "prescription_items_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
