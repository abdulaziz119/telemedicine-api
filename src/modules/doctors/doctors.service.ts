import { StatusCodes } from "http-status-codes"
import {AppError, AppLanguage, buildPaginationMeta, getLocalizedText, serializeAuditFields} from "../../shared";
import {DoctorsFindAllDto} from "./dto";
import {DoctorsRepository} from "./doctors.repository";

export class DoctorsService {

  constructor(private readonly doctorsRepository: DoctorsRepository) {}

  async findAll(query: DoctorsFindAllDto, language: AppLanguage) {
    const [doctors, total] = await Promise.all([
      this.doctorsRepository.findMany(query),
      this.doctorsRepository.count(query)
    ])

    return {
      data: doctors.map((doctor) => this.serializeDoctor(doctor, language)),
      meta: buildPaginationMeta(query, total)
    }
  }

  async getOne(doctor_id: string, language: AppLanguage) {
    const doctor = await this.doctorsRepository.findById(doctor_id)

    if (!doctor) {
      throw new AppError(StatusCodes.NOT_FOUND, "DOCTOR_NOT_FOUND", "doctors.errors.service.doctorNotFound")
    }

    return this.serializeDoctor(doctor, language)
  }

  private serializeDoctor(doctor: {
    id: string
    email: string
    full_name: string
    role: string
    created_by: string | null
    updated_by: string | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
    doctor_profile: {
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
      id: doctor.id,
      email: doctor.email,
      full_name: doctor.full_name,
      role: doctor.role,
      specialization: getLocalizedText(doctor.doctor_profile?.specialization, language),
      consultation_fee: doctor.doctor_profile?.consultation_fee ?? null,
      ...serializeAuditFields(doctor)
    }
  }
}
