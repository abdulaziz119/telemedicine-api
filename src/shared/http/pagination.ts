import { z } from "zod"

export const defaultPage = 1
export const defaultLimit = 10
export const maxLimit = 100

export const paginationQueryDto = z.object({
  page: z.coerce
    .number({
      invalid_type_error: "common.validation.dto.pageInvalid"
    })
    .int("common.validation.dto.pageInvalid")
    .min(1, "common.validation.dto.pageInvalid")
    .default(defaultPage),
  limit: z.coerce
    .number({
      invalid_type_error: "common.validation.dto.limitInvalid"
    })
    .int("common.validation.dto.limitInvalid")
    .min(1, "common.validation.dto.limitInvalid")
    .max(maxLimit, "common.validation.dto.limitTooLarge")
    .default(defaultLimit)
})

export type PaginationQueryDto = z.infer<typeof paginationQueryDto>

export function getPaginationParams(pagination: PaginationQueryDto) {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit
  }
}

export function buildPaginationMeta(pagination: PaginationQueryDto, total: number) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / pagination.limit)
  }
}
