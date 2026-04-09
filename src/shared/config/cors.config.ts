import { FastifyCorsOptions } from "@fastify/cors"
import { CorsOptions } from "cors"

const allowedHeaders: string[] = ["Content-Type", "Authorization", "Accept-Language", "X-Lang"]
const allowedMethods: string[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

export const corsOptions: CorsOptions = {
  origin: true,
  credentials: true,
  methods: allowedMethods,
  allowedHeaders
}

export const fastifyCorsOptions: FastifyCorsOptions = {
  origin: true,
  credentials: corsOptions.credentials ?? true,
  methods: allowedMethods,
  allowedHeaders
}
