import { UserRole } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import { PrismaExecutor } from "../../shared/database/prisma.types"
import { buildPaginationMeta } from "../../shared/http/pagination"
import { AppError } from "../../shared/http/app-error"
import { AppLanguage } from "../../shared/i18n/i18n.service"
import { getLocalizedText } from "../../shared/i18n/localized-text"
import { serializeAuditFields } from "../../shared/serializers/base.serializer"
import { AuthenticatedUser } from "../auth/auth.types"
import { UsersFindAllDto } from "./dto/users.dto"
import { UsersRepository } from "./users.repository"

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(query: UsersFindAllDto, language: AppLanguage, currentUser: AuthenticatedUser) {
    const user = await this.usersRepository.findActiveById({
      user_id: currentUser.id,
      ...(query.role ? { role: query.role } : {})
    })
    const users = user ? [user] : []
    const total = users.length

    return {
      data: users.map((user) => this.serializeUser(user, language)),
      meta: buildPaginationMeta(query, total)
    }
  }

  async getOne(user_id: string, language: AppLanguage, currentUser: AuthenticatedUser) {
    if (user_id !== currentUser.id) {
      throw new AppError(StatusCodes.NOT_FOUND, "USER_NOT_FOUND", "users.errors.service.userNotFound")
    }

    const user = await this.usersRepository.findActiveById({
      user_id
    })

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "USER_NOT_FOUND", "users.errors.service.userNotFound")
    }

    return this.serializeUser(user, language)
  }

  async ensureActivePatientExists(patient_id: string, executor: PrismaExecutor) {
    const patient = await this.usersRepository.findActiveById(
      {
        user_id: patient_id,
        role: UserRole.PATIENT
      },
      executor
    )

    if (!patient) {
      throw new AppError(StatusCodes.NOT_FOUND, "PATIENT_NOT_FOUND", "users.errors.service.patientNotFound")
    }

    return patient
  }

  async ensureActiveDoctorExists(doctor_id: string, executor: PrismaExecutor) {
    const doctor = await this.usersRepository.findActiveById(
      {
        user_id: doctor_id,
        role: UserRole.DOCTOR
      },
      executor
    )

    if (!doctor || !doctor.doctor_profile || doctor.doctor_profile.deleted_at !== null) {
      throw new AppError(StatusCodes.NOT_FOUND, "DOCTOR_NOT_FOUND", "users.errors.service.doctorNotFound")
    }

    return doctor
  }

  private serializeUser(user: {
    id: string
    email: string
    full_name: string
    role: UserRole
    created_by: string | null
    updated_by: string | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
    doctor_profile: {
      id: string
      specialization: unknown
      consultation_fee: number
      created_by: string | null
      updated_by: string | null
      created_at: Date
      updated_at: Date
      deleted_at: Date | null
    } | null
  }, language: AppLanguage) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      ...serializeAuditFields(user),
      doctor_profile: user.doctor_profile
        ? {
            id: user.doctor_profile.id,
            specialization: getLocalizedText(user.doctor_profile.specialization, language),
            consultation_fee: user.doctor_profile.consultation_fee,
            ...serializeAuditFields(user.doctor_profile)
          }
        : null
    }
  }
}
