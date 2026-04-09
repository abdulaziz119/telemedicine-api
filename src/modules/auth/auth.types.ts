import { UserRole } from "@prisma/client"

export type AuthenticatedUser = {
  id: string
  email: string
  full_name: string
  role: UserRole
}
