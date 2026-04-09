import type { AppointmentStatus } from "@prisma/client"
import type { PrescriptionsCreateDto } from "./dto"

export interface PrescriptionParticipantSummary {
  id: string
  email: string
  full_name: string
}

export interface PrescriptionAppointmentSummary {
  id: string
  status: AppointmentStatus
  starts_at: Date
  ends_at: Date
}

export interface PrescriptionItemSerializerInput {
  id: string
  medication_name: unknown
  dosage: unknown
  instructions: unknown | null
  created_by: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface PrescriptionSerializerInput {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  issued_at: Date
  created_by: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  items: PrescriptionItemSerializerInput[]
  appointment?: PrescriptionAppointmentSummary
  doctor?: PrescriptionParticipantSummary
  patient?: PrescriptionParticipantSummary
}

export interface PrescriptionCreateInput {
  appointment_id: string
  patient_id: string
  doctor_id: string
  items: PrescriptionsCreateDto["items"]
}
