import { z } from "zod"
import { AppLanguage, defaultLanguage } from "./i18n.service"

export interface LocalizedText {
  uz: string
  en: string
  ru: string
}

export function localizedTextDto(messages: { uz: string; en: string; ru: string }) {
  return z.object({
    uz: z
      .string({
        required_error: messages.uz
      })
      .trim()
      .min(1, messages.uz),
    en: z
      .string({
        required_error: messages.en
      })
      .trim()
      .min(1, messages.en),
    ru: z
      .string({
        required_error: messages.ru
      })
      .trim()
      .min(1, messages.ru)
  })
}

export function getLocalizedText(value: unknown, language: AppLanguage): string | null {
  if (!isLocalizedText(value)) {
    return null
  }

  return value[language] || value[defaultLanguage] || value.uz || value.en || value.ru || null
}

export function createLocalizedText(uz: string, en: string, ru: string): LocalizedText {
  return {
    uz,
    en,
    ru
  }
}

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.uz === "string" &&
    typeof candidate.en === "string" &&
    typeof candidate.ru === "string"
  )
}
