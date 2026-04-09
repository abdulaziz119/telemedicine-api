const nodeEnv = process.env.NODE_ENV ?? "development"
const jwtSecret = process.env.JWT_SECRET ?? (nodeEnv === "production" ? undefined : "dev-jwt-secret-change-me")

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required when NODE_ENV=production.")
}

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600),
  jwtSecret,
  nodeEnv,
  port: Number(process.env.PORT ?? 3000)
}
