ALTER TABLE "users"
RENAME COLUMN "created_by_id" TO "created_by";

ALTER TABLE "users"
RENAME COLUMN "updated_by_id" TO "updated_by";

ALTER TABLE "doctor_profiles"
RENAME COLUMN "created_by_id" TO "created_by";

ALTER TABLE "doctor_profiles"
RENAME COLUMN "updated_by_id" TO "updated_by";

ALTER TABLE "appointments"
RENAME COLUMN "created_by_id" TO "created_by";

ALTER TABLE "appointments"
RENAME COLUMN "updated_by_id" TO "updated_by";

ALTER TABLE "prescriptions"
RENAME COLUMN "created_by_id" TO "created_by";

ALTER TABLE "prescriptions"
RENAME COLUMN "updated_by_id" TO "updated_by";

ALTER TABLE "prescription_items"
RENAME COLUMN "created_by_id" TO "created_by";

ALTER TABLE "prescription_items"
RENAME COLUMN "updated_by_id" TO "updated_by";

ALTER TABLE "users"
RENAME CONSTRAINT "users_created_by_id_fkey" TO "users_created_by_fkey";

ALTER TABLE "users"
RENAME CONSTRAINT "users_updated_by_id_fkey" TO "users_updated_by_fkey";

ALTER TABLE "doctor_profiles"
RENAME CONSTRAINT "doctor_profiles_created_by_id_fkey" TO "doctor_profiles_created_by_fkey";

ALTER TABLE "doctor_profiles"
RENAME CONSTRAINT "doctor_profiles_updated_by_id_fkey" TO "doctor_profiles_updated_by_fkey";

ALTER TABLE "appointments"
RENAME CONSTRAINT "appointments_created_by_id_fkey" TO "appointments_created_by_fkey";

ALTER TABLE "appointments"
RENAME CONSTRAINT "appointments_updated_by_id_fkey" TO "appointments_updated_by_fkey";

ALTER TABLE "prescriptions"
RENAME CONSTRAINT "prescriptions_created_by_id_fkey" TO "prescriptions_created_by_fkey";

ALTER TABLE "prescriptions"
RENAME CONSTRAINT "prescriptions_updated_by_id_fkey" TO "prescriptions_updated_by_fkey";

ALTER TABLE "prescription_items"
RENAME CONSTRAINT "prescription_items_created_by_id_fkey" TO "prescription_items_created_by_fkey";

ALTER TABLE "prescription_items"
RENAME CONSTRAINT "prescription_items_updated_by_id_fkey" TO "prescription_items_updated_by_fkey";
