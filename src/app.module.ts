import { FastifyInstance } from "fastify"
import { PrismaClient } from "@prisma/client"
import {
  buildAppointmentsModule,
  buildAuthModule,
  buildDoctorsModule,
  buildPrescriptionsModule,
  buildUsersModule
} from "./modules";

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
