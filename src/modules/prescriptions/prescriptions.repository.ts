import { PrismaClient } from "@prisma/client"
import {PrescriptionsCreateDto, PrescriptionsFindAllDto} from "./dto";
import {getPaginationParams, PrismaExecutor} from "../../shared";

export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: PrescriptionsFindAllDto) {
    return this.prisma.prescription.findMany({
      where: this.buildWhere(query),
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
            starts_at: true,
            ends_at: true
          }
        },
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
        items: {
          orderBy: {
            created_at: "asc"
          }
        }
      },
      orderBy: {
        issued_at: "desc"
      },
      ...getPaginationParams(query)
    })
  }

  async count(query: PrescriptionsFindAllDto) {
    return this.prisma.prescription.count({
      where: this.buildWhere(query)
    })
  }

  async findById(prescription_id: string, executor: PrismaExecutor = this.prisma) {
    return executor.prescription.findFirst({
      where: {
        id: prescription_id,
        deleted_at: null
      },
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
            starts_at: true,
            ends_at: true
          }
        },
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
        items: {
          orderBy: {
            created_at: "asc"
          }
        }
      }
    })
  }

  async create(
    executor: PrismaExecutor,
    data: {
      appointment_id: string
      patient_id: string
      doctor_id: string
      items: PrescriptionsCreateDto["items"]
    },
    actor_id?: string
  ) {
    return executor.prescription.create({
      data: {
        appointment_id: data.appointment_id,
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        created_by: actor_id ?? null,
        updated_by: actor_id ?? null,
        items: {
          create: data.items.map((item) => ({
            medication_name: item.medication_name,
            dosage: item.dosage,
            instructions: item.instructions,
            created_by: actor_id ?? null,
            updated_by: actor_id ?? null
          }))
        }
      },
      include: {
        items: {
          orderBy: {
            created_at: "asc"
          }
        }
      }
    })
  }

  private buildWhere(query: Omit<PrescriptionsFindAllDto, "page" | "limit">) {
    return {
      deleted_at: null,
      ...(query.appointment_id ? { appointment_id: query.appointment_id } : {}),
      ...(query.doctor_id ? { doctor_id: query.doctor_id } : {}),
      ...(query.patient_id ? { patient_id: query.patient_id } : {})
    }
  }
}
