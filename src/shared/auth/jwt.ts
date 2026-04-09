import { createHmac, timingSafeEqual } from "node:crypto"
import { UserRole, userRoles } from "../../modules/users/users.enum"

type JwtHeader = {
  alg: "HS256"
  typ: "JWT"
}

export type AccessTokenPayload = {
  sub: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))

  return Buffer.from(normalized + padding, "base64")
}

function sign(content: string, secret: string) {
  return base64UrlEncode(createHmac("sha256", secret).update(content).digest())
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  if (!payload || typeof payload !== "object") {
    return false
  }

  const candidate = payload as Record<string, unknown>

  return (
    typeof candidate.sub === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === userRoles.DOCTOR || candidate.role === userRoles.PATIENT) &&
    typeof candidate.iat === "number" &&
    typeof candidate.exp === "number"
  )
}

export function createAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds: number
) {
  const header: JwtHeader = {
    alg: "HS256",
    typ: "JWT"
  }
  const issuedAt = Math.floor(Date.now() / 1000)
  const tokenPayload: AccessTokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload))
  const content = `${encodedHeader}.${encodedPayload}`

  return {
    token: `${content}.${sign(content, secret)}`,
    payload: tokenPayload
  }
}

export function verifyAccessToken(token: string, secret: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".")

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null
  }

  const content = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = sign(content, secret)
  const providedSignature = Buffer.from(encodedSignature)
  const actualSignature = Buffer.from(expectedSignature)

  if (
    providedSignature.length !== actualSignature.length ||
    !timingSafeEqual(providedSignature, actualSignature)
  ) {
    return null
  }

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8")) as Partial<JwtHeader>

    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as unknown

    if (!isAccessTokenPayload(payload) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
