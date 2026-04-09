import { AppointmentStatus, PrismaClient } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import { buildPaginationMeta } from "../../shared/http/pagination"
import { AppError } from "../../shared/http/app-error"
import { AppLanguage } from "../../shared/i18n/i18n.service"
import { getLocalizedText } from "../../shared/i18n/localized-text"
import { serializeAuditFields, serializeDate } from "../../shared/serializers/base.serializer"
import { AppointmentsRepository } from "../appointments/appointments.repository"
import { AuthService } from "../auth/auth.service"
import { AuthenticatedUser } from "../auth/auth.types"
import { PrescriptionsCreateDto, PrescriptionsFindAllDto } from "./dto/prescriptions.dto"
import { PrescriptionsRepository } from "./prescriptions.repository"

export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly prescriptionsRepository: PrescriptionsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly authService: AuthService
  ) {}

  async findAll(query: PrescriptionsFindAllDto, language: AppLanguage, currentUser: AuthenticatedUser) {
    const scopedQuery = currentUser.role === "DOCTOR"
      ? {
          ...query,
          doctor_id: currentUser.id
        }
      : {
          ...query,
          patient_id: currentUser.id
        }

    const [prescriptions, total] = await Promise.all([
      this.prescriptionsRepository.findMany(scopedQuery),
      this.prescriptionsRepository.count(scopedQuery)
    ])

    return {
      data: prescriptions.map((prescription) => this.serializePrescription(prescription, language)),
      meta: buildPaginationMeta(query, total)
    }
  }

  async getOne(prescription_id: string, language: AppLanguage, currentUser: AuthenticatedUser) {
    const prescription = await this.prescriptionsRepository.findById(prescription_id)

    if (
      !prescription ||
      (currentUser.role === "DOCTOR" && prescription.doctor_id !== currentUser.id) ||
      (currentUser.role === "PATIENT" && prescription.patient_id !== currentUser.id)
    ) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "PRESCRIPTION_NOT_FOUND",
        "prescriptions.errors.service.prescriptionNotFound"
      )
    }

    return this.serializePrescription(prescription, language)
  }

  async createPrescription(
    appointment_id: string,
    data: PrescriptionsCreateDto,
    language: AppLanguage,
    currentUser: AuthenticatedUser
  ) {
    this.authService.ensureDoctor(currentUser)
    this.authService.ensureActorMatchesUser(data.doctor_id, currentUser, "doctor")

    const prescription = await this.prisma.$transaction(async (transactionClient) => {
      const appointment = await this.appointmentsRepository.findActiveById(transactionClient, appointment_id)

      if (!appointment) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "APPOINTMENT_NOT_FOUND",
          "appointments.errors.service.appointmentNotFound"
        )
      }

      if (appointment.doctor_id !== data.doctor_id) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "APPOINTMENT_NOT_FOUND_FOR_DOCTOR",
          "appointments.errors.service.appointmentNotFoundForDoctor"
        )
      }

      if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "PRESCRIPTION_REQUIRES_COMPLETED_APPOINTMENT",
          "prescriptions.errors.service.prescriptionRequiresCompletedAppointment"
        )
      }

      if (appointment.prescription && appointment.prescription.deleted_at === null) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "PRESCRIPTION_ALREADY_EXISTS",
          "prescriptions.errors.service.prescriptionAlreadyExists"
        )
      }

      return this.prescriptionsRepository.create(transactionClient, {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        items: data.items
      }, currentUser.id)
    })

    return this.serializePrescription(prescription, language)
  }

  private serializePrescription(prescription: {
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
    items: Array<{
      id: string
      medication_name: unknown
      dosage: unknown
      instructions: unknown | null
      created_by: string | null
      updated_by: string | null
      created_at: Date
      updated_at: Date
      deleted_at: Date | null
    }>
    appointment?: {
      id: string
      status: AppointmentStatus
      starts_at: Date
      ends_at: Date
    }
    doctor?: {
      id: string
      email: string
      full_name: string
    }
    patient?: {
      id: string
      email: string
      full_name: string
    }
  }, language: AppLanguage) {
    return {
      id: prescription.id,
      appointment_id: prescription.appointment_id,
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      issued_at: serializeDate(prescription.issued_at),
      ...serializeAuditFields(prescription),
      appointment: prescription.appointment
        ? {
            id: prescription.appointment.id,
            status: prescription.appointment.status,
            starts_at: serializeDate(prescription.appointment.starts_at),
            ends_at: serializeDate(prescription.appointment.ends_at)
          }
        : undefined,
      doctor: prescription.doctor
        ? {
            id: prescription.doctor.id,
            email: prescription.doctor.email,
            full_name: prescription.doctor.full_name
          }
        : undefined,
      patient: prescription.patient
        ? {
            id: prescription.patient.id,
            email: prescription.patient.email,
            full_name: prescription.patient.full_name
          }
        : undefined,
      items: prescription.items.map((item) => ({
        id: item.id,
        medication_name: getLocalizedText(item.medication_name, language),
        dosage: getLocalizedText(item.dosage, language),
        instructions: getLocalizedText(item.instructions, language),
        ...serializeAuditFields(item)
      }))
    }
  }
}
