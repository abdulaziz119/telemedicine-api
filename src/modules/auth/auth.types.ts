import { UserRole } from "../users/users.enum"

export type AuthenticatedUser = {
  id: string
  email: string
  full_name: string
  role: UserRole
}
