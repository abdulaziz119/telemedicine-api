import { z } from "zod"
import {paginationQueryDto} from "../../../shared";
import { userRoles } from "../users.enum";

export const usersFindAllDto = paginationQueryDto.extend({
  role: z
    .nativeEnum(userRoles, {
      invalid_type_error: "users.validation.dto.roleInvalid"
    })
    .optional()
})

export const usersFindByIdDto = z.object({
  user_id: z
    .string({
      required_error: "users.validation.dto.userIdRequired"
    })
    .trim()
    .min(1, "users.validation.dto.userIdRequired"),
  role: z.nativeEnum(userRoles, {
    invalid_type_error: "users.validation.dto.roleInvalid"
  }).optional()
})

export const usersGetOneDto = z.object({
  id: z
    .string({
      required_error: "users.validation.dto.userIdRequired"
    })
    .trim()
    .min(1, "users.validation.dto.userIdRequired")
})

export type UsersFindAllDto = z.infer<typeof usersFindAllDto>
export type UsersFindByIdDto = z.infer<typeof usersFindByIdDto>
