import { z } from "zod"
import { paginationQueryDto } from "../../../shared/http/pagination"

export const doctorsFindAllDto = paginationQueryDto.extend({
  specialization: z
    .string({
      invalid_type_error: "doctors.validation.dto.specializationInvalid"
    })
    .trim()
    .min(1, "doctors.validation.dto.specializationInvalid")
    .optional()
})

export const doctorsGetOneDto = z.object({
  id: z
    .string({
      required_error: "doctors.validation.dto.doctorIdRequired"
    })
    .trim()
    .min(1, "doctors.validation.dto.doctorIdRequired")
})

export type DoctorsFindAllDto = z.infer<typeof doctorsFindAllDto>
