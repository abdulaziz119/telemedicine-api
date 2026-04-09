import type { AppointmentStatus } from "@prisma/client"

export interface AppointmentParticipantSummary {
  id: string
  email: string
  full_name: string
}

export interface AppointmentPrescriptionSummary {
  id: string
}

export interface AppointmentSerializerInput {
  id: string
  doctor_id: string
  patient_id: string
  starts_at: Date
  ends_at: Date
  status: AppointmentStatus
  completed_at: Date | null
  cancelled_at: Date | null
  created_by: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  doctor?: AppointmentParticipantSummary
  patient?: AppointmentParticipantSummary
  prescription?: AppointmentPrescriptionSummary | null
}
