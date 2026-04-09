import "dotenv/config"
import { buildApp } from "./app"
import {env} from "./shared";

const app = buildApp()

async function start(): Promise<void> {
  try {
    await app.listen({
      host: env.host,
      port: env.port
    })

    app.log.info(`Server listening at: ${env.host}:${env.port}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()
