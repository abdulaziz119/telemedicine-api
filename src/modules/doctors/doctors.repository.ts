import { Prisma, PrismaClient } from "@prisma/client"
import {DoctorsFindAllDto} from "./dto";
import {getPaginationParams} from "../../shared";
import { userRoles } from "../users/users.enum";

export class DoctorsRepository {

  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: DoctorsFindAllDto) {
    const where = this.buildWhere(query)

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        created_by: true,
        updated_by: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        doctor_profile: {
          select: {
            specialization: true,
            consultation_fee: true,
            created_by: true,
            updated_by: true,
            created_at: true,
            updated_at: true,
            deleted_at: true
          }
        }
      },
      orderBy: {
        full_name: "asc"
      },
      ...getPaginationParams(query)
    })
  }

  async count(query: DoctorsFindAllDto): Promise<number> {
    return this.prisma.user.count({
      where: this.buildWhere(query)
    })
  }

  async findById(doctor_id: string) {
    return this.prisma.user.findFirst({
      where: {
        id: doctor_id,
        role: userRoles.DOCTOR,
        deleted_at: null,
        doctor_profile: {
          is: {
            deleted_at: null
          }
        }
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        created_by: true,
        updated_by: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        doctor_profile: {
          select: {
            specialization: true,
            consultation_fee: true,
            created_by: true,
            updated_by: true,
            created_at: true,
            updated_at: true,
            deleted_at: true
          }
        }
      }
    })
  }

  private buildWhere(query: Pick<DoctorsFindAllDto, "specialization">) {
    return {
      role: userRoles.DOCTOR,
      deleted_at: null,
      doctor_profile: query.specialization
        ? {
            is: {
              deleted_at: null,
              OR: [
                {
                  specialization: {
                    path: ["uz"],
                    string_contains: query.specialization,
                    mode: Prisma.QueryMode.insensitive
                  }
                },
                {
                  specialization: {
                    path: ["en"],
                    string_contains: query.specialization,
                    mode: Prisma.QueryMode.insensitive
                  }
                },
                {
                  specialization: {
                    path: ["ru"],
                    string_contains: query.specialization,
                    mode: Prisma.QueryMode.insensitive
                  }
                }
              ]
            }
          }
        : {
            is: {
              deleted_at: null
            }
          }
    }
  }
}
