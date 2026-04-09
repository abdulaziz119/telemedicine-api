import { PrismaClient } from "@prisma/client"
import { DoctorsController } from "./doctors.controller"
import { DoctorsRepository } from "./doctors.repository"
import { DoctorsService } from "./doctors.service"
import {AuthService} from "../auth";

export function buildDoctorsModule(prisma: PrismaClient, authService: AuthService) {
  const repository = new DoctorsRepository(prisma)
  const service = new DoctorsService(repository)
  const controller = new DoctorsController(service, authService)

  return {
    controller
  }
}
