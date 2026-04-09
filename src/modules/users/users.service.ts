import { StatusCodes } from "http-status-codes"
import { UsersRepository } from "./users.repository"
import {UsersFindAllDto} from "./dto";
import type { UserSerializerInput } from "./users.interfaces";
import { userRoles } from "./users.enum";
import {
  AppError,
  AppLanguage,
  buildPaginationMeta,
  getLocalizedText,
  PrismaExecutor,
  serializeAuditFields
} from "../../shared";
import {AuthenticatedUser} from "../auth";

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(query: UsersFindAllDto, language: AppLanguage, currentUser: AuthenticatedUser) {
    const { users, total } = await this.usersRepository.findAll(query)

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
        role: userRoles.PATIENT
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
        role: userRoles.DOCTOR
      },
      executor
    )

    if (!doctor || !doctor.doctor_profile || doctor.doctor_profile.deleted_at !== null) {
      throw new AppError(StatusCodes.NOT_FOUND, "DOCTOR_NOT_FOUND", "users.errors.service.doctorNotFound")
    }

    return doctor
  }

  private serializeUser(user: UserSerializerInput, language: AppLanguage) {
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
