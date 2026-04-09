import { PrismaClient } from "@prisma/client"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

export function buildAuthModule(prisma: PrismaClient) {
  const service = new AuthService(prisma)
  const controller = new AuthController(service)

  return {
    service,
    controller
  }
}
