import { PrismaClient } from "@prisma/client"
import { AuthService } from "../auth/auth.service"
import { UsersController } from "./users.controller"
import { UsersRepository } from "./users.repository"
import { UsersService } from "./users.service"

export function buildUsersModule(prisma: PrismaClient, authService: AuthService) {
  const repository = new UsersRepository(prisma)
  const service = new UsersService(repository)
  const controller = new UsersController(service, authService)

  return {
    repository,
    service,
    controller
  }
}
