import {UserRole} from "../users";

export type AuthenticatedUser = {
  id: string
  email: string
  full_name: string
  role: UserRole
}
