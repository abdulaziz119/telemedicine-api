import { Prisma } from "@prisma/client"
import { FastifyError, FastifyInstance } from "fastify"
import { ReasonPhrases, StatusCodes, getReasonPhrase } from "http-status-codes"
import { ZodError, ZodIssue } from "zod"
import { AppError } from "./app-error"
import { getRequestLanguage } from "./request-language"
import {I18nService} from "../i18n";

const prismaConstraintErrors = {
  appointments_doctor_schedule_no_overlap: new AppError(
    StatusCodes.CONFLICT,
    "APPOINTMENT_SLOT_BUSY",
    "appointments.errors.service.appointmentSlotBusy"
  ),
  appointments_patient_schedule_no_overlap: new AppError(
    StatusCodes.CONFLICT,
    "APPOINTMENT_PATIENT_BUSY",
    "appointments.errors.service.appointmentPatientBusy"
  )
} satisfies Record<string, AppError>

function getConstraintNameFromDatabaseError(databaseError: string) {
  return Object.keys(prismaConstraintErrors).find((constraintName) => {
    return databaseError.includes(`"${constraintName}"`) || databaseError.includes(constraintName)
  })
}

function isAuditActorForeignKey(fieldName: string) {
  return fieldName.includes("created_by") || fieldName.includes("updated_by")
}

export function mapPrismaKnownRequestError(error: Prisma.PrismaClientKnownRequestError) {
  if (error.code === "P2002") {
    return new AppError(
      StatusCodes.CONFLICT,
      "RESOURCE_ALREADY_EXISTS",
      "common.errors.http.resourceAlreadyExists"
    )
  }

  if (error.code === "P2004") {
    const constraint = typeof error.meta?.constraint === "string" ? error.meta.constraint : undefined
    const databaseError = typeof error.meta?.database_error === "string" ? error.meta.database_error : undefined
    const constraintName = constraint ?? (databaseError ? getConstraintNameFromDatabaseError(databaseError) : undefined)

    if (constraintName && constraintName in prismaConstraintErrors) {
      return prismaConstraintErrors[constraintName as keyof typeof prismaConstraintErrors]
    }
  }

  if (error.code === "P2003") {
    const fieldName = typeof error.meta?.field_name === "string" ? error.meta.field_name : undefined

    if (fieldName && isAuditActorForeignKey(fieldName)) {
      return new AppError(
        StatusCodes.BAD_REQUEST,
        "REQUEST_ACTOR_NOT_FOUND",
        "common.errors.http.requestActorNotFound"
      )
    }
  }

  if (error.code === "P2034") {
    return new AppError(
      StatusCodes.CONFLICT,
      "CONCURRENT_CONFLICT",
      "common.errors.http.concurrentConflict"
    )
  }

  return null
}

function mapZodIssueToTranslationKey(issue: ZodIssue): string {
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return "common.validation.dto.requiredField"
  }

  if (issue.code === "invalid_date") {
    return "common.validation.dto.invalidDate"
  }

  if (issue.code === "too_small" && issue.type === "string") {
    return "common.validation.dto.stringTooShort"
  }

  if (issue.code === "too_small" && issue.type === "array") {
    return "common.validation.dto.arrayTooSmall"
  }

  return "common.validation.dto.invalidInput"
}

function mapZodIssues(error: ZodError, i18nService: I18nService, language: ReturnType<typeof getRequestLanguage>) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: i18nService.translate(
      language,
      i18nService.hasKey(issue.message) ? issue.message : mapZodIssueToTranslationKey(issue)
    )
  }))
}

export function registerGlobalErrorHandler(app: FastifyInstance, i18nService: I18nService) {
  app.setNotFoundHandler((request, reply) => {
    const language = getRequestLanguage(request)

    return reply.status(StatusCodes.NOT_FOUND).send({
      status_code: StatusCodes.NOT_FOUND,
      error: ReasonPhrases.NOT_FOUND,
      error_code: "ROUTE_NOT_FOUND",
      message: i18nService.translate(language, "common.errors.http.routeNotFound")
    })
  })

  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const language = getRequestLanguage(request)

    if (error instanceof ZodError) {
      return reply.status(StatusCodes.BAD_REQUEST).send({
        status_code: StatusCodes.BAD_REQUEST,
        error: ReasonPhrases.BAD_REQUEST,
        error_code: "VALIDATION_ERROR",
        message: i18nService.translate(language, "common.validation.dto.validationFailed"),
        issues: mapZodIssues(error, i18nService, language)
      })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        status_code: error.statusCode,
        error: getReasonPhrase(error.statusCode),
        error_code: error.errorCode,
        message: i18nService.translate(language, error.messageKey),
        details: error.details ?? undefined
      })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaAppError = mapPrismaKnownRequestError(error)

      if (prismaAppError) {
        return reply.status(prismaAppError.statusCode).send({
          status_code: prismaAppError.statusCode,
          error: getReasonPhrase(prismaAppError.statusCode),
          error_code: prismaAppError.errorCode,
          message: i18nService.translate(language, prismaAppError.messageKey),
          details: prismaAppError.details ?? undefined
        })
      }
    }

    const statusCode =
      typeof (error as FastifyError).statusCode === "number" ? (error as FastifyError).statusCode : undefined

    if (
      statusCode !== undefined &&
      statusCode >= StatusCodes.BAD_REQUEST &&
      statusCode < StatusCodes.INTERNAL_SERVER_ERROR
    ) {
      return reply.status(statusCode).send({
        status_code: statusCode,
        error: getReasonPhrase(statusCode),
        error_code: "REQUEST_ERROR",
        message: i18nService.translate(language, "common.validation.dto.invalidInput")
      })
    }

    request.log.error(error)

    return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      status_code: StatusCodes.INTERNAL_SERVER_ERROR,
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
      error_code: "INTERNAL_SERVER_ERROR",
      message: i18nService.translate(language, "common.errors.http.internalServerError")
    })
  })
}
