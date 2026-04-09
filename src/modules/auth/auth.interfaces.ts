import {UserRole} from "../users";

export interface AuthUserRecord {
  id: string
  email: string
  full_name: string
  role: UserRole
}

export interface AuthLoginUserRecord extends AuthUserRecord {
  password_hash: string | null
}
