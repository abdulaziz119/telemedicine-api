import { PrismaClient } from "@prisma/client"
import { AppointmentsRepository } from "../appointments/appointments.repository"
import { AuthService } from "../auth/auth.service"
import { PrescriptionsController } from "./prescriptions.controller"
import { PrescriptionsRepository } from "./prescriptions.repository"
import { PrescriptionsService } from "./prescriptions.service"

export function buildPrescriptionsModule(
  prisma: PrismaClient,
  appointmentsRepository: AppointmentsRepository,
  authService: AuthService
) {
  const repository = new PrescriptionsRepository(prisma)
  const service = new PrescriptionsService(prisma, repository, appointmentsRepository, authService)
  const controller = new PrescriptionsController(service, authService)

  return {
    repository,
    service,
    controller
  }
}
