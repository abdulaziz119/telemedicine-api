import { describe, expect, it } from "vitest"
import { PrismaClient } from "@prisma/client"
import {AuthService, userRoles} from "../../../src/modules";
import {hashPassword} from "../../../src/shared";

function createSubject(storedPasswordHash: string | null) {
  const user = {
    id: "doctor-1",
    email: "doctor@example.com",
    full_name: "Doctor User",
    role: userRoles.DOCTOR,
    password_hash: storedPasswordHash
  }

  const prisma = {
    user: {
      async findFirst({ select }: { select: Record<string, boolean> }) {
        if (select.password_hash) {
          return user
        }

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    }
  } as unknown as PrismaClient

  return new AuthService(prisma)
}

describe("AuthService", () => {
  it("logs in with valid credentials and returns a bearer token", async () => {
    const service = createSubject(await hashPassword("DoctorPass123!"))

    const result = await service.login({
      email: "doctor@example.com",
      password: "DoctorPass123!"
    })

    expect(result.token_type).toBe("Bearer")
    expect(result.access_token.split(".")).toHaveLength(3)
    expect(result.user).toEqual({
      id: "doctor-1",
      email: "doctor@example.com",
      full_name: "Doctor User",
      role: userRoles.DOCTOR
    })
  })

  it("rejects invalid credentials", async () => {
    const service = createSubject(await hashPassword("DoctorPass123!"))

    await expect(
      service.login({
        email: "doctor@example.com",
        password: "WrongPass123!"
      })
    ).rejects.toMatchObject({
      errorCode: "INVALID_CREDENTIALS"
    })
  })

  it("authenticates a valid bearer token", async () => {
    const service = createSubject(await hashPassword("DoctorPass123!"))
    const login = await service.login({
      email: "doctor@example.com",
      password: "DoctorPass123!"
    })

    const user = await service.authenticateRequest({
      headers: {
        authorization: `Bearer ${login.access_token}`
      }
    } as never)

    expect(user).toEqual({
      id: "doctor-1",
      email: "doctor@example.com",
      full_name: "Doctor User",
      role: userRoles.DOCTOR
    })
  })
})
