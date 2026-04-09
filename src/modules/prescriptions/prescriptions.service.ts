import { AppointmentStatus, PrismaClient } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import { PrescriptionsRepository } from "./prescriptions.repository"
import type { PrescriptionSerializerInput } from "./prescriptions.interfaces"
import {AppointmentsRepository} from "../appointments";
import {AuthenticatedUser, AuthService} from "../auth";
import {PrescriptionsCreateDto, PrescriptionsFindAllDto} from "./dto";
import {
  AppError,
  AppLanguage,
  buildPaginationMeta,
  getLocalizedText,
  serializeAuditFields,
  serializeDate
} from "../../shared";
import {userRoles} from "../users";

export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly prescriptionsRepository: PrescriptionsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly authService: AuthService
  ) {}

  async findAll(query: PrescriptionsFindAllDto, language: AppLanguage, currentUser: AuthenticatedUser) {
    const scopedQuery = currentUser.role === userRoles.DOCTOR
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
      (currentUser.role === userRoles.DOCTOR && prescription.doctor_id !== currentUser.id) ||
      (currentUser.role === userRoles.PATIENT && prescription.patient_id !== currentUser.id)
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

  private serializePrescription(prescription: PrescriptionSerializerInput, language: AppLanguage) {
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
