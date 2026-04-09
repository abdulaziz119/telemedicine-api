import { Prisma, PrismaClient } from "@prisma/client"
import {UsersFindByIdDto} from "./dto";
import {PrismaExecutor} from "../../shared";

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
}
