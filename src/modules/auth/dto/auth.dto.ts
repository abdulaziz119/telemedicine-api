import { z } from "zod"

export const authLoginDto = z.object({
  email: z
    .string({
      required_error: "auth.validation.dto.emailRequired"
    })
    .trim()
    .min(1, "auth.validation.dto.emailRequired")
    .email("auth.validation.dto.emailInvalid"),
  password: z
    .string({
      required_error: "auth.validation.dto.passwordRequired"
    })
    .min(1, "auth.validation.dto.passwordRequired")
})

export type AuthLoginDto = z.infer<typeof authLoginDto>
