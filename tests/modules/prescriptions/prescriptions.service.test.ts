import { describe, expect, it } from "vitest"
import { AppointmentStatus, PrismaClient, UserRole } from "@prisma/client"
import { AppError } from "../../../src/shared/http/app-error"
import { AppointmentsRepository } from "../../../src/modules/appointments/appointments.repository"
import { AuthService } from "../../../src/modules/auth/auth.service"
import { AuthenticatedUser } from "../../../src/modules/auth/auth.types"
import { PrescriptionsRepository } from "../../../src/modules/prescriptions/prescriptions.repository"
import { PrescriptionsService } from "../../../src/modules/prescriptions/prescriptions.service"
import { PrescriptionsCreateDto } from "../../../src/modules/prescriptions/dto/prescriptions.dto"
import { StatusCodes } from "http-status-codes"

function buildCurrentUser(role: UserRole, overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: role === UserRole.DOCTOR ? "doctor-1" : "patient-1",
    email: role === UserRole.DOCTOR ? "doctor@example.com" : "patient@example.com",
    full_name: role === UserRole.DOCTOR ? "Doctor User" : "Patient User",
    role,
    ...overrides
  }
}

function createAuthServiceMock(calls: {
  ensureDoctor: AuthenticatedUser[]
  actorChecks: Array<{ actorId: string; user: AuthenticatedUser; mismatch: "doctor" | "patient" }>
}) {
  return {
    ensureDoctor(user: AuthenticatedUser) {
      calls.ensureDoctor.push(user)

      if (user.role !== UserRole.DOCTOR) {
        throw new AppError(StatusCodes.FORBIDDEN, "ONLY_DOCTORS_ALLOWED", "auth.errors.service.onlyDoctorsAllowed")
      }
    },
    ensureActorMatchesUser(actorId: string, user: AuthenticatedUser, mismatch: "doctor" | "patient") {
      calls.actorChecks.push({
        actorId,
        user,
        mismatch
      })

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
  } as unknown as AuthService
}

function buildPrescriptionDto(overrides: Partial<PrescriptionsCreateDto> = {}): PrescriptionsCreateDto {
  return {
    doctor_id: "doctor-1",
    items: [
      {
        medication_name: {
          uz: "Paratsetamol",
          en: "Paracetamol",
          ru: "Парацетамол"
        },
        dosage: {
          uz: "Kuniga 2 mahal",
          en: "Twice a day",
          ru: "2 раза в день"
        },
        instructions: {
          uz: "Ovqatdan keyin",
          en: "After meals",
          ru: "После еды"
        }
      }
    ],
    ...overrides
  }
}

function createSubject() {
  const transactionClient = {
    tx: true
  }

  const calls = {
    transactions: [] as Array<unknown>,
    appointmentLookups: [] as Array<{ executor: unknown; appointment_id: string }>,
    prescriptionCreates: [] as Array<{
      executor: unknown
      data: {
        appointment_id: string
        patient_id: string
        doctor_id: string
        items: PrescriptionsCreateDto["items"]
      }
      actor_id: string | undefined
    }>,
    auth: {
      ensureDoctor: [] as AuthenticatedUser[],
      actorChecks: [] as Array<{ actorId: string; user: AuthenticatedUser; mismatch: "doctor" | "patient" }>
    }
  }

  const prisma = {
    $transaction: async <T>(callback: (executor: typeof transactionClient) => Promise<T>) => {
      calls.transactions.push({})

      return callback(transactionClient)
    }
  } as unknown as PrismaClient

  const appointmentsRepository = {
    async findActiveById(executor: unknown, appointment_id: string) {
      calls.appointmentLookups.push({
        executor,
        appointment_id
      })

      return {
        id: appointment_id,
        doctor_id: "doctor-1",
        patient_id: "patient-1",
        status: AppointmentStatus.COMPLETED,
        prescription: null
      }
    }
  } as unknown as AppointmentsRepository

  const prescriptionsRepository = {
    async create(
      executor: unknown,
      data: {
        appointment_id: string
        patient_id: string
        doctor_id: string
        items: PrescriptionsCreateDto["items"]
      },
      actor_id?: string
    ) {
      calls.prescriptionCreates.push({
        executor,
        data,
        actor_id
      })

      return {
        id: "prescription-1",
        appointment_id: data.appointment_id,
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        issued_at: new Date("2026-04-10T12:00:00.000Z"),
        created_by: actor_id ?? null,
        updated_by: actor_id ?? null,
        created_at: new Date("2026-04-10T12:00:00.000Z"),
        updated_at: new Date("2026-04-10T12:00:00.000Z"),
        deleted_at: null,
        items: data.items.map((item, index) => ({
          id: `item-${index + 1}`,
          medication_name: item.medication_name,
          dosage: item.dosage,
          instructions: item.instructions ?? null,
          created_by: actor_id ?? null,
          updated_by: actor_id ?? null,
          created_at: new Date("2026-04-10T12:00:00.000Z"),
          updated_at: new Date("2026-04-10T12:00:00.000Z"),
          deleted_at: null
        }))
      }
    }
  } as unknown as PrescriptionsRepository

  return {
    service: new PrescriptionsService(
      prisma,
      prescriptionsRepository,
      appointmentsRepository,
      createAuthServiceMock(calls.auth)
    ),
    calls,
    transactionClient
  }
}

describe("PrescriptionsService.createPrescription", () => {
  it("rejects when a patient tries to create a prescription", async () => {
    const { service, calls } = createSubject()

    await expect(
      service.createPrescription("appointment-1", buildPrescriptionDto(), "uz", buildCurrentUser(UserRole.PATIENT))
    ).rejects.toMatchObject({
      errorCode: "ONLY_DOCTORS_ALLOWED"
    })

    expect(calls.auth.ensureDoctor).toHaveLength(1)
    expect(calls.transactions).toHaveLength(0)
  })

  it("rejects when doctor_id does not match the authenticated doctor", async () => {
    const { service, calls } = createSubject()

    await expect(
      service.createPrescription(
        "appointment-1",
        buildPrescriptionDto({
          doctor_id: "doctor-2"
        }),
        "uz",
        buildCurrentUser(UserRole.DOCTOR)
      )
    ).rejects.toMatchObject({
      errorCode: "DOCTOR_ID_FORBIDDEN"
    })

    expect(calls.auth.actorChecks).toEqual([
      {
        actorId: "doctor-2",
        user: buildCurrentUser(UserRole.DOCTOR),
        mismatch: "doctor"
      }
    ])
    expect(calls.transactions).toHaveLength(0)
  })

  it("stores audit actor ids on prescription and items", async () => {
    const { service, calls, transactionClient } = createSubject()
    const input = buildPrescriptionDto()

    const prescription = await service.createPrescription(
      "appointment-1",
      input,
      "uz",
      buildCurrentUser(UserRole.DOCTOR)
    )

    expect(calls.transactions).toHaveLength(1)
    expect(calls.appointmentLookups[0]).toEqual({
      executor: transactionClient,
      appointment_id: "appointment-1"
    })
    expect(calls.prescriptionCreates[0]).toEqual({
      executor: transactionClient,
      data: {
        appointment_id: "appointment-1",
        patient_id: "patient-1",
        doctor_id: "doctor-1",
        items: input.items
      },
      actor_id: "doctor-1"
    })
    expect(prescription).toEqual({
      id: "prescription-1",
      appointment_id: "appointment-1",
      patient_id: "patient-1",
      doctor_id: "doctor-1",
      issued_at: "2026-04-10T12:00:00.000Z",
      created_by: "doctor-1",
      updated_by: "doctor-1",
      created_at: "2026-04-10T12:00:00.000Z",
      updated_at: "2026-04-10T12:00:00.000Z",
      deleted_at: null,
      appointment: undefined,
      doctor: undefined,
      patient: undefined,
      items: [
        {
          id: "item-1",
          medication_name: "Paratsetamol",
          dosage: "Kuniga 2 mahal",
          instructions: "Ovqatdan keyin",
          created_by: "doctor-1",
          updated_by: "doctor-1",
          created_at: "2026-04-10T12:00:00.000Z",
          updated_at: "2026-04-10T12:00:00.000Z",
          deleted_at: null
        }
      ]
    })
  })
})
