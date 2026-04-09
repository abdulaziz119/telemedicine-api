import enErrors from "./locales/en/errors.json"
import enValidation from "./locales/en/validation.json"
import ruErrors from "./locales/ru/errors.json"
import ruValidation from "./locales/ru/validation.json"
import uzErrors from "./locales/uz/errors.json"
import uzValidation from "./locales/uz/validation.json"

export const supportedLanguages = ["uz", "en", "ru"] as const
export const defaultLanguage = "uz" as const

export type AppLanguage = (typeof supportedLanguages)[number]
export type TranslationKey = string

type TranslationTree = {
  [key: string]: string | TranslationTree
}

function groupTranslations(errors: TranslationTree, validation: TranslationTree): TranslationTree {
  const moduleNames = new Set([...Object.keys(errors), ...Object.keys(validation)])
  const groupedTranslations: TranslationTree = {}

  for (const moduleName of moduleNames) {
    groupedTranslations[moduleName] = {
      errors: (errors[moduleName] as TranslationTree | undefined) ?? {},
      validation: (validation[moduleName] as TranslationTree | undefined) ?? {}
    }
  }

  return groupedTranslations
}

const translations: Record<AppLanguage, TranslationTree> = {
  uz: groupTranslations(uzErrors, uzValidation),
  en: groupTranslations(enErrors, enValidation),
  ru: groupTranslations(ruErrors, ruValidation)
}

function resolveTranslation(tree: TranslationTree, key: string): string | undefined {
  return key.split(".").reduce<string | TranslationTree | undefined>((currentValue, currentPart) => {
    if (!currentValue || typeof currentValue === "string") {
      return undefined
    }

    return currentValue[currentPart]
  }, tree) as string | undefined
}

export class I18nService {
  translate(language: AppLanguage, key: TranslationKey): string {
    return (
      resolveTranslation(translations[language], key) ??
      resolveTranslation(translations[defaultLanguage], key) ??
      key
    )
  }

  hasKey(key: TranslationKey): boolean {
    return resolveTranslation(translations[defaultLanguage], key) !== undefined
  }
}
