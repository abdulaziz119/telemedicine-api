import { AppointmentStatus, PrismaClient } from "@prisma/client"
import { PrismaExecutor } from "../../shared/database/prisma.types"
import { getPaginationParams } from "../../shared/http/pagination"
import { AppointmentsCreateDto, AppointmentsFindAllDto } from "./dto/appointments.dto"
import { buildScheduledAppointmentConflictWhere } from "./appointments.time"

export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: AppointmentsFindAllDto) {
    return this.prisma.appointment.findMany({
      where: this.buildWhere(query),
      include: {
        doctor: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        patient: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        prescription: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        starts_at: "desc"
      },
      ...getPaginationParams(query)
    })
  }

  async count(query: AppointmentsFindAllDto) {
    return this.prisma.appointment.count({
      where: this.buildWhere(query)
    })
  }

  async findConflictingScheduledSlot(
    executor: PrismaExecutor,
    doctor_id: string,
    starts_at: Date,
    ends_at: Date
  ) {
    return executor.appointment.findFirst({
      where: buildScheduledAppointmentConflictWhere("doctor_id", doctor_id, {
        starts_at,
        ends_at
      }),
      select: {
        id: true
      }
    })
  }

  async findConflictingScheduledPatientSlot(
    executor: PrismaExecutor,
    patient_id: string,
    starts_at: Date,
    ends_at: Date
  ) {
    return executor.appointment.findFirst({
      where: buildScheduledAppointmentConflictWhere("patient_id", patient_id, {
        starts_at,
        ends_at
      }),
      select: {
        id: true
      }
    })
  }

  async create(executor: PrismaExecutor, data: AppointmentsCreateDto, actor_id?: string) {
    return executor.appointment.create({
      data: {
        doctor_id: data.doctor_id,
        patient_id: data.patient_id,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        created_by: actor_id ?? null,
        updated_by: actor_id ?? null
      }
    })
  }

  async findActiveById(executor: PrismaExecutor, appointment_id: string) {
    return executor.appointment.findFirst({
      where: {
        id: appointment_id,
        deleted_at: null
      },
      include: {
        prescription: {
          select: {
            id: true,
            deleted_at: true
          }
        }
      }
    })
  }

  async findDetailedById(appointment_id: string, executor: PrismaExecutor = this.prisma) {
    return executor.appointment.findFirst({
      where: {
        id: appointment_id,
        deleted_at: null
      },
      include: {
        doctor: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        patient: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        },
        prescription: {
          select: {
            id: true
          }
        }
      }
    })
  }

  async markAsCompleted(executor: PrismaExecutor, appointment_id: string, actor_id?: string) {
    return executor.appointment.update({
      where: {
        id: appointment_id
      },
      data: {
        status: AppointmentStatus.COMPLETED,
        completed_at: new Date(),
        updated_by: actor_id ?? null
      }
    })
  }

  private buildWhere(query: Omit<AppointmentsFindAllDto, "page" | "limit">) {
    return {
      deleted_at: null,
      ...(query.doctor_id ? { doctor_id: query.doctor_id } : {}),
      ...(query.patient_id ? { patient_id: query.patient_id } : {}),
      ...(query.status ? { status: query.status } : {})
    }
  }
}
