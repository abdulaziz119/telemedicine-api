import { FastifyInstance } from "fastify"
import { PrismaClient } from "@prisma/client"
import { buildAuthModule } from "./modules/auth/auth.module"
import { buildAppointmentsModule } from "./modules/appointments/appointments.module"
import { buildDoctorsModule } from "./modules/doctors/doctors.module"
import { buildPrescriptionsModule } from "./modules/prescriptions/prescriptions.module"
import { buildUsersModule } from "./modules/users/users.module"

export function registerAppModules(app: FastifyInstance, prisma: PrismaClient):void {
  const authModule = buildAuthModule(prisma)
  const usersModule = buildUsersModule(prisma, authModule.service)
  const doctorsModule = buildDoctorsModule(prisma, authModule.service)
  const appointmentsModule = buildAppointmentsModule(prisma, usersModule.service, authModule.service)
  const prescriptionsModule = buildPrescriptionsModule(prisma, appointmentsModule.repository, authModule.service)

  authModule.controller.registerRoutes(app)
  usersModule.controller.registerRoutes(app)
  doctorsModule.controller.registerRoutes(app)
  appointmentsModule.controller.registerRoutes(app)
  prescriptionsModule.controller.registerRoutes(app)
}
