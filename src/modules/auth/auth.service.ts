import { PrismaClient } from "@prisma/client"
import { FastifyRequest } from "fastify"
import { StatusCodes } from "http-status-codes"
import {AuthLoginDto} from "./dto";
import {AppError, createAccessToken, env, verifyAccessToken, verifyPassword} from "../../shared";
import {AuthenticatedUser} from "./auth.types";
import type { AuthUserRecord } from "./auth.interfaces";
import {userRoles} from "../users";

function getBearerToken(request: FastifyRequest) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(" ")

  if (scheme !== "Bearer" || !token) {
    return null
  }

  return token
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async login(data: AuthLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        password_hash: true
      }
    })

    if (!user?.password_hash || !(await verifyPassword(data.password, user.password_hash))) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        "auth.errors.service.invalidCredentials"
      )
    }

    const { token } = createAccessToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      env.jwtSecret,
      env.jwtExpiresInSeconds
    )

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: env.jwtExpiresInSeconds,
      user: this.serializeAuthenticatedUser(user)
    }
  }

  async authenticateRequest(request: FastifyRequest) {
    const token = getBearerToken(request)

    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "AUTH_REQUIRED", "auth.errors.service.authRequired")
    }

    const payload = verifyAccessToken(token, env.jwtSecret)

    if (!payload) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "INVALID_AUTH_TOKEN",
        "auth.errors.service.invalidAuthToken"
      )
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true
      }
    })

    if (!user) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "INVALID_AUTH_TOKEN",
        "auth.errors.service.invalidAuthToken"
      )
    }

    return this.serializeAuthenticatedUser(user)
  }

  ensureDoctor(user: AuthenticatedUser) {
    if (user.role !== userRoles.DOCTOR) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "ONLY_DOCTORS_ALLOWED",
        "auth.errors.service.onlyDoctorsAllowed"
      )
    }
  }

  ensurePatient(user: AuthenticatedUser) {
    if (user.role !== userRoles.PATIENT) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "ONLY_PATIENTS_ALLOWED",
        "auth.errors.service.onlyPatientsAllowed"
      )
    }
  }

  ensureActorMatchesUser(actorId: string, user: AuthenticatedUser, mismatch: "doctor" | "patient") {
    if (actorId !== user.id) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        mismatch === "doctor" ? "DOCTOR_ID_FORBIDDEN" : "PATIENT_ID_FORBIDDEN",
        mismatch === "doctor"
          ? "auth.errors.service.doctorIdForbidden"
          : "auth.errors.service.patientIdForbidden"
      )
    }
  }

  private serializeAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  }
}
