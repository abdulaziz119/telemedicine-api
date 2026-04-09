import { PrismaClient } from "@prisma/client"
import { PrescriptionsController } from "./prescriptions.controller"
import { PrescriptionsRepository } from "./prescriptions.repository"
import { PrescriptionsService } from "./prescriptions.service"
import {AppointmentsRepository} from "../appointments";
import {AuthService} from "../auth";

export function buildPrescriptionsModule(
  prisma: PrismaClient,
  appointmentsRepository: AppointmentsRepository,
  authService: AuthService
) {
  const repository = new PrescriptionsRepository(prisma)
  const service = new PrescriptionsService(prisma, repository, appointmentsRepository, authService)
  const controller = new PrescriptionsController(service, authService)

  return {
    controller
  }
}
