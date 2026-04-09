import { AppointmentStatus } from "@prisma/client"
import { z } from "zod"

import { paginationQueryDto } from "../../../shared/http/pagination"

export const appointmentsCreateDto = z.object({
  patient_id: z
    .string({
      required_error: "appointments.validation.dto.patientIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.patientIdRequired"),
  doctor_id: z
    .string({
      required_error: "appointments.validation.dto.doctorIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.doctorIdRequired"),
  starts_at: z
    .string({
      required_error: "appointments.validation.dto.startsAtRequired"
    })
    .datetime({
      message: "appointments.validation.dto.startsAtInvalid"
    })
    .transform((value) => new Date(value)),
  ends_at: z
    .string({
      required_error: "appointments.validation.dto.endsAtRequired"
    })
    .datetime({
      message: "appointments.validation.dto.endsAtInvalid"
    })
    .transform((value) => new Date(value))
})

export const appointmentsCompleteDto = z.object({
  doctor_id: z
    .string({
      required_error: "appointments.validation.dto.completeDoctorIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.completeDoctorIdRequired")
})

export const appointmentsFindAllDto = paginationQueryDto.extend({
  doctor_id: z
    .string({
      invalid_type_error: "appointments.validation.dto.doctorIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.doctorIdRequired")
    .optional(),
  patient_id: z
    .string({
      invalid_type_error: "appointments.validation.dto.patientIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.patientIdRequired")
    .optional(),
  status: z
    .nativeEnum(AppointmentStatus, {
      invalid_type_error: "appointments.validation.dto.statusInvalid"
    })
    .optional()
})

export const appointmentsParamsDto = z.object({
  id: z
    .string({
      required_error: "appointments.validation.dto.appointmentIdRequired"
    })
    .trim()
    .min(1, "appointments.validation.dto.appointmentIdRequired")
})

export type AppointmentsCreateDto = z.infer<typeof appointmentsCreateDto>
export type AppointmentsCompleteDto = z.infer<typeof appointmentsCompleteDto>
export type AppointmentsFindAllDto = z.infer<typeof appointmentsFindAllDto>
