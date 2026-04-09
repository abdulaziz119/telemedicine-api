import { PrismaClient } from "@prisma/client"
import { UsersController } from "./users.controller"
import { UsersRepository } from "./users.repository"
import { UsersService } from "./users.service"
import {AuthService} from "../auth";

export function buildUsersModule(prisma: PrismaClient, authService: AuthService) {
  const repository = new UsersRepository(prisma)
  const service = new UsersService(repository)
  const controller = new UsersController(service, authService)

  return {
    service,
    controller
  }
}
