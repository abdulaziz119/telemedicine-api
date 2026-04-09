import { Prisma, PrismaClient } from "@prisma/client"

import { PrismaExecutor } from "../../shared/database/prisma.types"
import { getPaginationParams } from "../../shared/http/pagination"
import { UsersFindAllDto, UsersFindByIdDto } from "./dto/users.dto"

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: UsersFindAllDto) {
    return this.prisma.user.findMany({
      where: this.buildWhere(query),
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
            id: true,
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
        created_at: "desc"
      },
      ...getPaginationParams(query)
    })
  }

  async count(query: UsersFindAllDto) {
    return this.prisma.user.count({
      where: this.buildWhere(query)
    })
  }

  async findActiveById(data: UsersFindByIdDto, executor: PrismaExecutor = this.prisma) {
    const where: Prisma.UserWhereInput = {
      id: data.user_id,
      deleted_at: null
    }

    if (data.role) {
      where.role = data.role
    }

    return executor.user.findFirst({
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
            id: true,
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

  private buildWhere(query: Pick<UsersFindAllDto, "role">): Prisma.UserWhereInput {
    return {
      deleted_at: null,
      ...(query.role ? { role: query.role } : {})
    }
  }
}
