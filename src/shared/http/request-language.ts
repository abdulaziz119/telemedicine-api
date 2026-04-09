import { FastifyRequest } from "fastify"
import { AppLanguage, defaultLanguage, supportedLanguages } from "../i18n/i18n.service"

function normalizeLanguage(rawValue: string | undefined): AppLanguage {
  if (!rawValue) {
    return defaultLanguage
  }

  const normalizedValue: string = rawValue
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split("-")[0]

  return supportedLanguages.includes(normalizedValue as AppLanguage)
    ? (normalizedValue as AppLanguage)
    : defaultLanguage
}

export function getRequestLanguage(request: FastifyRequest): AppLanguage {
  const xLangHeader = request.headers["x-lang"]
  const acceptLanguageHeader = request.headers["accept-language"]

  const preferredHeader = Array.isArray(xLangHeader) ? xLangHeader[0] : xLangHeader
  const fallbackHeader = Array.isArray(acceptLanguageHeader) ? acceptLanguageHeader[0] : acceptLanguageHeader

  return normalizeLanguage(preferredHeader ?? fallbackHeader)
}
