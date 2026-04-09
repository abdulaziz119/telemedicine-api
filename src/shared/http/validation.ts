import { ZodTypeAny, z } from "zod"

export function parseDto<TSchema extends ZodTypeAny>(schema: TSchema, data: unknown): z.infer<TSchema> {
  return schema.parse(data)
}
