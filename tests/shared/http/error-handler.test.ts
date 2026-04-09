import { describe, expect, it } from "vitest"
import { Prisma } from "@prisma/client"
import {mapPrismaKnownRequestError} from "../../../src/shared";

function buildKnownRequestError(
  code: string,
  meta?: Prisma.PrismaClientKnownRequestError["meta"]
) {
  return new Prisma.PrismaClientKnownRequestError("test error", {
    code,
    clientVersion: "test",
    meta
  })
}

describe("mapPrismaKnownRequestError", () => {
  it("maps unique-constraint errors to a resource exists response", () => {
    const error = buildKnownRequestError("P2002")
    const mappedError = mapPrismaKnownRequestError(error)

    expect(mappedError).toMatchObject({
      errorCode: "RESOURCE_ALREADY_EXISTS",
      messageKey: "common.errors.http.resourceAlreadyExists"
    })
  })

  it("maps doctor exclusion-constraint errors to doctor slot busy", () => {
    const error = buildKnownRequestError("P2004", {
      database_error:
        'conflicting key value violates exclusion constraint "appointments_doctor_schedule_no_overlap"'
    })
    const mappedError = mapPrismaKnownRequestError(error)

    expect(mappedError).toMatchObject({
      errorCode: "APPOINTMENT_SLOT_BUSY",
      messageKey: "appointments.errors.service.appointmentSlotBusy"
    })
  })

  it("maps patient exclusion-constraint errors to patient busy", () => {
    const error = buildKnownRequestError("P2004", {
      database_error:
        'conflicting key value violates exclusion constraint "appointments_patient_schedule_no_overlap"'
    })
    const mappedError = mapPrismaKnownRequestError(error)

    expect(mappedError).toMatchObject({
      errorCode: "APPOINTMENT_PATIENT_BUSY",
      messageKey: "appointments.errors.service.appointmentPatientBusy"
    })
  })

  it("maps invalid audit actors to a request actor not found response", () => {
    const error = buildKnownRequestError("P2003", {
      field_name: "appointments_created_by_fkey"
    })
    const mappedError = mapPrismaKnownRequestError(error)

    expect(mappedError).toMatchObject({
      errorCode: "REQUEST_ACTOR_NOT_FOUND",
      messageKey: "common.errors.http.requestActorNotFound"
    })
  })

  it("maps serializable transaction conflicts to concurrent conflict", () => {
    const error = buildKnownRequestError("P2034")
    const mappedError = mapPrismaKnownRequestError(error)

    expect(mappedError).toMatchObject({
      errorCode: "CONCURRENT_CONFLICT",
      messageKey: "common.errors.http.concurrentConflict"
    })
  })

  it("returns null for unrelated Prisma errors", () => {
    const error = buildKnownRequestError("P2003", {
      field_name: "appointments_doctor_id_fkey"
    })

    expect(mapPrismaKnownRequestError(error)).toBeNull()
  })
})
