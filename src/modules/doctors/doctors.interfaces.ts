import {UserRole} from "../users";


export interface DoctorProfileSerializerInput {
  specialization: unknown
  consultation_fee: number
  created_by: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface DoctorSerializerInput {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_by: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  doctor_profile: DoctorProfileSerializerInput | null
}
