import { AppointmentStatus, Prisma, PrismaClient } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import { AppointmentsRepository } from "./appointments.repository"
import type { AppointmentSerializerInput } from "./appointments.interfaces"
import {userRoles, UsersService} from "../users";
import {AuthenticatedUser, AuthService} from "../auth";
import {AppointmentsCompleteDto, AppointmentsCreateDto, AppointmentsFindAllDto} from "./dto";
import {AppError, buildPaginationMeta, serializeAuditFields, serializeDate, serializeNullableDate} from "../../shared";

export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  async findAll(query: AppointmentsFindAllDto, currentUser: AuthenticatedUser) {
    const scopedQuery = currentUser.role === userRoles.DOCTOR
      ? {
          ...query,
          doctor_id: currentUser.id
        }
      : {
          ...query,
          patient_id: currentUser.id
        }

    const [appointments, total] = await Promise.all([
      this.appointmentsRepository.findMany(scopedQuery),
      this.appointmentsRepository.count(scopedQuery)
    ])

    return {
      data: appointments.map((appointment) => this.serializeAppointment(appointment)),
      meta: buildPaginationMeta(query, total)
    }
  }

  async getOne(appointment_id: string, currentUser: AuthenticatedUser) {
    const appointment = await this.appointmentsRepository.findDetailedById(appointment_id)

    if (
      !appointment ||
      (currentUser.role === userRoles.DOCTOR && appointment.doctor_id !== currentUser.id) ||
      (currentUser.role === userRoles.PATIENT && appointment.patient_id !== currentUser.id)
    ) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "APPOINTMENT_NOT_FOUND",
        "appointments.errors.service.appointmentNotFound"
      )
    }

    return this.serializeAppointment(appointment)
  }

  async createAppointment(data: AppointmentsCreateDto, currentUser: AuthenticatedUser) {
    this.authService.ensurePatient(currentUser)
    this.authService.ensureActorMatchesUser(data.patient_id, currentUser, "patient")

    if (data.starts_at <= new Date()) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "APPOINTMENT_IN_PAST",
        "appointments.errors.service.appointmentInPast"
      )
    }

    if (data.ends_at <= data.starts_at) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "APPOINTMENT_INVALID_RANGE",
        "appointments.errors.service.appointmentInvalidRange"
      )
    }

    const appointment = await this.prisma.$transaction(
      async (transactionClient) => {
        await this.usersService.ensureActiveDoctorExists(data.doctor_id, transactionClient)
        await this.usersService.ensureActivePatientExists(data.patient_id, transactionClient)

        const existingAppointment = await this.appointmentsRepository.findConflictingScheduledSlot(
          transactionClient,
          data.doctor_id,
          data.starts_at,
          data.ends_at
        )

        if (existingAppointment) {
          throw new AppError(
            StatusCodes.CONFLICT,
            "APPOINTMENT_SLOT_BUSY",
            "appointments.errors.service.appointmentSlotBusy"
          )
        }

        const existingPatientAppointment = await this.appointmentsRepository.findConflictingScheduledPatientSlot(
          transactionClient,
          data.patient_id,
          data.starts_at,
          data.ends_at
        )

        if (existingPatientAppointment) {
          throw new AppError(
            StatusCodes.CONFLICT,
            "APPOINTMENT_PATIENT_BUSY",
            "appointments.errors.service.appointmentPatientBusy"
          )
        }

        return this.appointmentsRepository.create(transactionClient, data, currentUser.id)
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    )

    return this.serializeAppointment(appointment)
  }

  async completeAppointment(appointment_id: string, data: AppointmentsCompleteDto, currentUser: AuthenticatedUser) {
    this.authService.ensureDoctor(currentUser)
    this.authService.ensureActorMatchesUser(data.doctor_id, currentUser, "doctor")

    const appointment = await this.prisma.$transaction(async (transactionClient) => {
      const currentAppointment = await this.appointmentsRepository.findActiveById(transactionClient, appointment_id)

      if (!currentAppointment) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "APPOINTMENT_NOT_FOUND",
          "appointments.errors.service.appointmentNotFound"
        )
      }

      if (currentAppointment.doctor_id !== data.doctor_id) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "APPOINTMENT_NOT_FOUND_FOR_DOCTOR",
          "appointments.errors.service.appointmentNotFoundForDoctor"
        )
      }

      if (currentAppointment.status === AppointmentStatus.CANCELLED) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "APPOINTMENT_CANCELLED_CANNOT_COMPLETE",
          "appointments.errors.service.appointmentCancelledCannotComplete"
        )
      }

      if (currentAppointment.status === AppointmentStatus.COMPLETED) {
        throw new AppError(
          StatusCodes.CONFLICT,
          "APPOINTMENT_ALREADY_COMPLETED",
          "appointments.errors.service.appointmentAlreadyCompleted"
        )
      }

      return this.appointmentsRepository.markAsCompleted(transactionClient, appointment_id, currentUser.id)
    })

    return this.serializeAppointment(appointment)
  }

  private serializeAppointment(appointment: AppointmentSerializerInput) {
    return {
      id: appointment.id,
      doctor_id: appointment.doctor_id,
      patient_id: appointment.patient_id,
      starts_at: serializeDate(appointment.starts_at),
      ends_at: serializeDate(appointment.ends_at),
      status: appointment.status,
      completed_at: serializeNullableDate(appointment.completed_at),
      cancelled_at: serializeNullableDate(appointment.cancelled_at),
      ...serializeAuditFields(appointment),
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            email: appointment.doctor.email,
            full_name: appointment.doctor.full_name
          }
        : undefined,
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            email: appointment.patient.email,
            full_name: appointment.patient.full_name
          }
        : undefined,
      prescription_id: appointment.prescription?.id ?? null
    }
  }
}
