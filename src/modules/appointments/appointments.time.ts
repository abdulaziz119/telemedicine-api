import { AppointmentStatus, Prisma } from "@prisma/client"

export type AppointmentTimeRange = {
  starts_at: Date
  ends_at: Date
}

export type AppointmentConflictParticipantField = "doctor_id" | "patient_id"

export function hasAppointmentOverlap(current: AppointmentTimeRange, candidate: AppointmentTimeRange) {
  return current.starts_at < candidate.ends_at && current.ends_at > candidate.starts_at
}

export function buildScheduledAppointmentConflictWhere(
  participantField: AppointmentConflictParticipantField,
  participantId: string,
  range: AppointmentTimeRange
): Prisma.AppointmentWhereInput {
  const participantFilter = participantField === "doctor_id"
    ? {
        doctor_id: participantId
      }
    : {
        patient_id: participantId
      }

  return {
    ...participantFilter,
    status: AppointmentStatus.SCHEDULED,
    deleted_at: null,
    starts_at: {
      lt: range.ends_at
    },
    ends_at: {
      gt: range.starts_at
    }
  }
}
