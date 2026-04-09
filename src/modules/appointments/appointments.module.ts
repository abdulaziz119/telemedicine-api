import { PrismaClient } from "@prisma/client"
import { AppointmentsController } from "./appointments.controller"
import { AppointmentsRepository } from "./appointments.repository"
import { AppointmentsService } from "./appointments.service"
import {UsersService} from "../users";
import {AuthService} from "../auth";

export function buildAppointmentsModule(prisma: PrismaClient, usersService: UsersService, authService: AuthService) {
  const repository = new AppointmentsRepository(prisma)
  const service = new AppointmentsService(prisma, repository, usersService, authService)
  const controller = new AppointmentsController(service, authService)

  return {
    repository,
    controller
  }
}
