import fastifyCors from "@fastify/cors"
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify"
import { PrismaClient } from "@prisma/client"
import { Logger, LogFn } from "pino"
import { registerAppModules } from "./app.module"
import { fastifyCorsOptions } from "./shared/config/cors.config"
import { env } from "./shared/config/env"
import { registerGlobalErrorHandler } from "./shared/http/error-handler"
import { I18nService } from "./shared/i18n/i18n.service"
import { prisma } from "./shared/database/prisma.client"

function filterFastifyStartupLogs(this: Logger, args: Parameters<LogFn>, method: LogFn): void {
  const [message] = args

  if (typeof message === "string" && message.startsWith("Server listening at ")) {
    return
  }

  method.apply(this, args)
}

const loggerOptions = {
  hooks: {
    logMethod: filterFastifyStartupLogs
  },
  ...(env.nodeEnv === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard"
          }
        }
      })
} satisfies Exclude<FastifyServerOptions["logger"], boolean>

export function buildApp(prismaClient: PrismaClient = prisma): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions
  })

  const i18nService = new I18nService()

  app.register(fastifyCors, fastifyCorsOptions)

  app.get("/health", async (): Promise<{status:string}> => ({
    status: "ok"
  }))

  registerAppModules(app, prismaClient)
  registerGlobalErrorHandler(app, i18nService)

  app.addHook("onClose", async ():Promise<void> => {
    if (prismaClient === prisma) {
      await prisma.$disconnect()
    }
  })

  return app
}
