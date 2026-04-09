import { describe, expect, it } from "vitest"
import {AppointmentStatus, Prisma, PrismaClient, UserRole} from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import {
  AppointmentsCreateDto,
  AppointmentsRepository, AppointmentsService,
  AuthenticatedUser,
  AuthService,
  userRoles, UsersService
} from "../../../src/modules";
import {AppError} from "../../../src/shared";

function buildCurrentUser(role: UserRole, overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: role === userRoles.DOCTOR ? "doctor-1" : "patient-1",
    email: role === userRoles.DOCTOR ? "doctor@example.com" : "patient@example.com",
    full_name: role === userRoles.DOCTOR ? "Doctor User" : "Patient User",
    role,
    ...overrides
  }
}

function buildCreateDto(overrides: Partial<AppointmentsCreateDto> = {}): AppointmentsCreateDto {
  return {
    patient_id: "patient-1",
    doctor_id: "doctor-1",
    starts_at: new Date("2026-04-10T10:00:00.000Z"),
    ends_at: new Date("2026-04-10T10:30:00.000Z"),
    ...overrides
  }
}

function buildStoredAppointment(
  data: AppointmentsCreateDto,
  overrides: Partial<{
    id: string
    status: AppointmentStatus
    completed_at: Date | null
    cancelled_at: Date | null
    created_by: string | null
    updated_by: string | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
  }> = {}
) {
  return {
    id: "appointment-1",
    doctor_id: data.doctor_id,
    patient_id: data.patient_id,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    status: AppointmentStatus.SCHEDULED,
    completed_at: null,
    cancelled_at: null,
    created_by: null,
    updated_by: null,
    created_at: new Date("2026-04-09T08:00:00.000Z"),
    updated_at: new Date("2026-04-09T08:00:00.000Z"),
    deleted_at: null,
    ...overrides
  }
}

function createAuthServiceMock(calls: {
  ensureDoctor: AuthenticatedUser[]
  ensurePatient: AuthenticatedUser[]
  actorChecks: Array<{ actorId: string; user: AuthenticatedUser; mismatch: "doctor" | "patient" }>
}) {
  return {
    ensureDoctor(user: AuthenticatedUser) {
      calls.ensureDoctor.push(user)

      if (user.role !== userRoles.DOCTOR) {
        throw new AppError(StatusCodes.FORBIDDEN, "ONLY_DOCTORS_ALLOWED", "auth.errors.service.onlyDoctorsAllowed")
      }
    },
    ensurePatient(user: AuthenticatedUser) {
      calls.ensurePatient.push(user)

      if (user.role !== userRoles.PATIENT) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "ONLY_PATIENTS_ALLOWED",
          "auth.errors.service.onlyPatientsAllowed"
        )
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

function createSubject(options: {
  doctorConflictAppointment?: { id: string } | null
  patientConflictAppointment?: { id: string } | null
  currentAppointment?: ReturnType<typeof buildStoredAppointment> | null
} = {}) {
  const transactionClient = {
    tx: true
  }

  const defaultAppointment = options.currentAppointment ?? buildStoredAppointment(buildCreateDto())

  const calls = {
    transactions: [] as Array<{ options: unknown }>,
    doctorChecks: [] as Array<{ doctor_id: string; executor: unknown }>,
    patientChecks: [] as Array<{ patient_id: string; executor: unknown }>,
    doctorConflictChecks: [] as Array<{
      executor: unknown
      doctor_id: string
      starts_at: Date
      ends_at: Date
    }>,
    patientConflictChecks: [] as Array<{
      executor: unknown
      patient_id: string
      starts_at: Date
      ends_at: Date
    }>,
    activeLookups: [] as Array<{ executor: unknown; appointment_id: string }>,
    creates: [] as Array<{ executor: unknown; data: AppointmentsCreateDto; actor_id: string | undefined }>,
    completions: [] as Array<{ executor: unknown; appointment_id: string; actor_id: string | undefined }>,
    auth: {
      ensureDoctor: [] as AuthenticatedUser[],
      ensurePatient: [] as AuthenticatedUser[],
      actorChecks: [] as Array<{ actorId: string; user: AuthenticatedUser; mismatch: "doctor" | "patient" }>
    }
  }

  const prisma = {
    $transaction: async <T>(
      callback: (executor: typeof transactionClient) => Promise<T>,
      options: unknown
    ) => {
      calls.transactions.push({
        options
      })

      return callback(transactionClient)
    }
  } as unknown as PrismaClient

  const appointmentsRepository = {
    async findConflictingScheduledSlot(executor: unknown, doctor_id: string, starts_at: Date, ends_at: Date) {
      calls.doctorConflictChecks.push({
        executor,
        doctor_id,
        starts_at,
        ends_at
      })

      return options.doctorConflictAppointment ?? null
    },
    async findConflictingScheduledPatientSlot(
      executor: unknown,
      patient_id: string,
      starts_at: Date,
      ends_at: Date
    ) {
      calls.patientConflictChecks.push({
        executor,
        patient_id,
        starts_at,
        ends_at
      })

      return options.patientConflictAppointment ?? null
    },
    async create(executor: unknown, data: AppointmentsCreateDto, actor_id?: string) {
      calls.creates.push({
        executor,
        data,
        actor_id
      })

      return buildStoredAppointment(data, {
        created_by: actor_id ?? null,
        updated_by: actor_id ?? null
      })
    },
    async findActiveById(executor: unknown, appointment_id: string) {
      calls.activeLookups.push({
        executor,
        appointment_id
      })

      return options.currentAppointment === null
        ? null
        : {
            ...defaultAppointment,
            id: appointment_id,
            prescription: null
          }
    },
    async markAsCompleted(executor: unknown, appointment_id: string, actor_id?: string) {
      calls.completions.push({
        executor,
        appointment_id,
        actor_id
      })

      return {
        ...defaultAppointment,
        id: appointment_id,
        status: AppointmentStatus.COMPLETED,
        completed_at: new Date("2026-04-10T11:00:00.000Z"),
        updated_at: new Date("2026-04-10T11:00:00.000Z"),
        updated_by: actor_id ?? null
      }
    }
  } as unknown as AppointmentsRepository

  const usersService = {
    async ensureActiveDoctorExists(doctor_id: string, executor: unknown) {
      calls.doctorChecks.push({
        doctor_id,
        executor
      })
    },
    async ensureActivePatientExists(patient_id: string, executor: unknown) {
      calls.patientChecks.push({
        patient_id,
        executor
      })
    }
  } as unknown as UsersService

  return {
    service: new AppointmentsService(
      prisma,
      appointmentsRepository,
      usersService,
      createAuthServiceMock(calls.auth)
    ),
    calls,
    transactionClient
  }
}

describe("AppointmentsService.createAppointment", () => {
  it("rejects when a doctor tries to create an appointment for a patient", async () => {
    const { service, calls } = createSubject()

    await expect(service.createAppointment(buildCreateDto(), buildCurrentUser(userRoles.DOCTOR))).rejects.toMatchObject({
      errorCode: "ONLY_PATIENTS_ALLOWED"
    })

    expect(calls.auth.ensurePatient).toHaveLength(1)
    expect(calls.transactions).toHaveLength(0)
  })

  it("rejects when the patient_id does not match the authenticated patient", async () => {
    const { service, calls } = createSubject()

    await expect(
      service.createAppointment(
        buildCreateDto({
          patient_id: "patient-2"
        }),
        buildCurrentUser(userRoles.PATIENT)
      )
    ).rejects.toMatchObject({
      errorCode: "PATIENT_ID_FORBIDDEN"
    })

    expect(calls.auth.actorChecks).toEqual([
      {
        actorId: "patient-2",
        user: buildCurrentUser(userRoles.PATIENT),
        mismatch: "patient"
      }
    ])
    expect(calls.transactions).toHaveLength(0)
  })

  it("rejects appointments that start in the past before opening a transaction", async () => {
    const { service, calls } = createSubject()
    const input = buildCreateDto({
      starts_at: new Date(Date.now() - 60 * 60 * 1000),
      ends_at: new Date(Date.now() + 60 * 60 * 1000)
    })

    await expect(service.createAppointment(input, buildCurrentUser(userRoles.PATIENT))).rejects.toMatchObject({
      errorCode: "APPOINTMENT_IN_PAST"
    })

    expect(calls.transactions).toHaveLength(0)
  })

  it("rejects invalid ranges when end is not after start", async () => {
    const { service, calls } = createSubject()
    const starts_at = new Date("2026-04-10T10:00:00.000Z")
    const input = buildCreateDto({
      starts_at,
      ends_at: starts_at
    })

    await expect(service.createAppointment(input, buildCurrentUser(userRoles.PATIENT))).rejects.toMatchObject({
      errorCode: "APPOINTMENT_INVALID_RANGE"
    })

    expect(calls.transactions).toHaveLength(0)
  })

  it("blocks creation when another scheduled slot overlaps", async () => {
    const { service, calls } = createSubject({
      doctorConflictAppointment: {
        id: "existing-appointment"
      }
    })
    const input = buildCreateDto()

    await expect(service.createAppointment(input, buildCurrentUser(userRoles.PATIENT))).rejects.toMatchObject({
      errorCode: "APPOINTMENT_SLOT_BUSY"
    })

    expect(calls.doctorChecks).toHaveLength(1)
    expect(calls.patientChecks).toHaveLength(1)
    expect(calls.doctorConflictChecks).toHaveLength(1)
    expect(calls.patientConflictChecks).toHaveLength(0)
    expect(calls.creates).toHaveLength(0)
  })

  it("blocks creation when the patient already has an overlapping appointment", async () => {
    const { service, calls } = createSubject({
      patientConflictAppointment: {
        id: "existing-patient-appointment"
      }
    })
    const input = buildCreateDto()

    await expect(service.createAppointment(input, buildCurrentUser(userRoles.PATIENT))).rejects.toMatchObject({
      errorCode: "APPOINTMENT_PATIENT_BUSY"
    })

    expect(calls.doctorChecks).toHaveLength(1)
    expect(calls.patientChecks).toHaveLength(1)
    expect(calls.doctorConflictChecks).toHaveLength(1)
    expect(calls.patientConflictChecks).toHaveLength(1)
    expect(calls.creates).toHaveLength(0)
  })

  it("stores audit actor ids when creating an appointment", async () => {
    const { service, calls, transactionClient } = createSubject()
    const input = buildCreateDto()
    const currentUser = buildCurrentUser(userRoles.PATIENT)

    const appointment = await service.createAppointment(input, currentUser)

    expect(calls.transactions).toHaveLength(1)
    expect(calls.transactions[0]).toEqual({
      options: {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    })
    expect(calls.doctorChecks[0]).toEqual({
      doctor_id: input.doctor_id,
      executor: transactionClient
    })
    expect(calls.patientChecks[0]).toEqual({
      patient_id: input.patient_id,
      executor: transactionClient
    })
    expect(calls.doctorConflictChecks[0]).toEqual({
      executor: transactionClient,
      doctor_id: input.doctor_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at
    })
    expect(calls.patientConflictChecks[0]).toEqual({
      executor: transactionClient,
      patient_id: input.patient_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at
    })
    expect(calls.creates[0]).toEqual({
      executor: transactionClient,
      data: input,
      actor_id: "patient-1"
    })
    expect(appointment).toEqual({
      id: "appointment-1",
      doctor_id: input.doctor_id,
      patient_id: input.patient_id,
      starts_at: input.starts_at.toISOString(),
      ends_at: input.ends_at.toISOString(),
      status: AppointmentStatus.SCHEDULED,
      completed_at: null,
      cancelled_at: null,
      created_by: "patient-1",
      updated_by: "patient-1",
      created_at: "2026-04-09T08:00:00.000Z",
      updated_at: "2026-04-09T08:00:00.000Z",
      deleted_at: null,
      doctor: undefined,
      patient: undefined,
      prescription_id: null
    })
  })
})

describe("AppointmentsService.completeAppointment", () => {
  it("rejects when a patient tries to complete an appointment", async () => {
    const { service, calls } = createSubject()

    await expect(
      service.completeAppointment("appointment-1", { doctor_id: "doctor-1" }, buildCurrentUser(userRoles.PATIENT))
    ).rejects.toMatchObject({
      errorCode: "ONLY_DOCTORS_ALLOWED"
    })

    expect(calls.auth.ensureDoctor).toHaveLength(1)
    expect(calls.transactions).toHaveLength(0)
  })

  it("rejects when the doctor_id does not match the authenticated doctor", async () => {
    const { service, calls } = createSubject()

    await expect(
      service.completeAppointment(
        "appointment-1",
        { doctor_id: "doctor-2" },
        buildCurrentUser(userRoles.DOCTOR)
      )
    ).rejects.toMatchObject({
      errorCode: "DOCTOR_ID_FORBIDDEN"
    })

    expect(calls.auth.actorChecks).toEqual([
      {
        actorId: "doctor-2",
        user: buildCurrentUser(userRoles.DOCTOR),
        mismatch: "doctor"
      }
    ])
    expect(calls.transactions).toHaveLength(0)
  })

  it("stores the last actor id when completing an appointment", async () => {
    const { service, calls, transactionClient } = createSubject({
      currentAppointment: buildStoredAppointment(buildCreateDto(), {
        created_by: "creator-1",
        updated_by: "creator-1"
      })
    })

    const appointment = await service.completeAppointment(
      "appointment-1",
      { doctor_id: "doctor-1" },
      buildCurrentUser(userRoles.DOCTOR)
    )

    expect(calls.activeLookups[0]).toEqual({
      executor: transactionClient,
      appointment_id: "appointment-1"
    })
    expect(calls.completions[0]).toEqual({
      executor: transactionClient,
      appointment_id: "appointment-1",
      actor_id: "doctor-1"
    })
    expect(appointment).toEqual({
      id: "appointment-1",
      doctor_id: "doctor-1",
      patient_id: "patient-1",
      starts_at: "2026-04-10T10:00:00.000Z",
      ends_at: "2026-04-10T10:30:00.000Z",
      status: AppointmentStatus.COMPLETED,
      completed_at: "2026-04-10T11:00:00.000Z",
      cancelled_at: null,
      created_by: "creator-1",
      updated_by: "doctor-1",
      created_at: "2026-04-09T08:00:00.000Z",
      updated_at: "2026-04-10T11:00:00.000Z",
      deleted_at: null,
      doctor: undefined,
      patient: undefined,
      prescription_id: null
    })
  })
})
