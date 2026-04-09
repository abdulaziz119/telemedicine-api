export const userRoles = {
  DOCTOR: "DOCTOR",
  PATIENT: "PATIENT"
} as const

export type UserRole = (typeof userRoles)[keyof typeof userRoles]
