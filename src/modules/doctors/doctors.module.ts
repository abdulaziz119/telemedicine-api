import { PrismaClient } from "@prisma/client"
import { AuthService } from "../auth/auth.service"
import { DoctorsController } from "./doctors.controller"
import { DoctorsRepository } from "./doctors.repository"
import { DoctorsService } from "./doctors.service"

export function buildDoctorsModule(prisma: PrismaClient, authService: AuthService) {
  const repository = new DoctorsRepository(prisma)
  const service = new DoctorsService(repository)
  const controller = new DoctorsController(service, authService)

  return {
    repository,
    service,
    controller
  }
}
