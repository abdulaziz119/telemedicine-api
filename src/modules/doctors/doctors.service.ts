import { StatusCodes } from "http-status-codes"
import {AppError, AppLanguage, buildPaginationMeta, getLocalizedText, serializeAuditFields} from "../../shared";
import {DoctorsFindAllDto} from "./dto";
import type { DoctorSerializerInput } from "./doctors.interfaces";
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

  private serializeDoctor(doctor: DoctorSerializerInput, language: AppLanguage) {
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
