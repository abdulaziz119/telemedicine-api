import { z } from "zod"
import {localizedTextDto, paginationQueryDto} from "../../../shared";

export const prescriptionsCreateDto = z.object({
  doctor_id: z
    .string({
      required_error: "prescriptions.validation.dto.doctorIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.doctorIdRequired"),
  items: z
    .array(
      z.object({
        medication_name: localizedTextDto({
          uz: "prescriptions.validation.dto.medicationNameUzRequired",
          en: "prescriptions.validation.dto.medicationNameEnRequired",
          ru: "prescriptions.validation.dto.medicationNameRuRequired"
        }),
        dosage: localizedTextDto({
          uz: "prescriptions.validation.dto.dosageUzRequired",
          en: "prescriptions.validation.dto.dosageEnRequired",
          ru: "prescriptions.validation.dto.dosageRuRequired"
        }),
        instructions: localizedTextDto({
          uz: "prescriptions.validation.dto.instructionsUzRequired",
          en: "prescriptions.validation.dto.instructionsEnRequired",
          ru: "prescriptions.validation.dto.instructionsRuRequired"
        }).optional()
      })
    )
    .min(1, "prescriptions.validation.dto.itemsRequired")
})

export const prescriptionsFindAllDto = paginationQueryDto.extend({
  appointment_id: z
    .string({
      invalid_type_error: "prescriptions.validation.dto.appointmentIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.appointmentIdRequired")
    .optional(),
  doctor_id: z
    .string({
      invalid_type_error: "prescriptions.validation.dto.doctorIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.doctorIdRequired")
    .optional(),
  patient_id: z
    .string({
      invalid_type_error: "prescriptions.validation.dto.patientIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.patientIdRequired")
    .optional()
})

export const prescriptionsGetOneDto = z.object({
  id: z
    .string({
      required_error: "prescriptions.validation.dto.prescriptionIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.prescriptionIdRequired")
})

export const prescriptionsParamsDto = z.object({
  id: z
    .string({
      required_error: "prescriptions.validation.dto.appointmentIdRequired"
    })
    .trim()
    .min(1, "prescriptions.validation.dto.appointmentIdRequired")
})

export type PrescriptionsCreateDto = z.infer<typeof prescriptionsCreateDto>
export type PrescriptionsFindAllDto = z.infer<typeof prescriptionsFindAllDto>
