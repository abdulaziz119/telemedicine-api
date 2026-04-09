import { describe, expect, it } from "vitest"
import { AppointmentStatus } from "@prisma/client"
import {
  buildScheduledAppointmentConflictWhere,
  hasAppointmentOverlap
} from "../../../src/modules/appointments/appointments.time"

describe("appointments.time", () => {
  const existingSlot = {
    starts_at: new Date("2026-04-10T10:00:00.000Z"),
    ends_at: new Date("2026-04-10T10:30:00.000Z")
  }

  it("detects overlap when a slot starts inside another slot", () => {
    const candidateSlot = {
      starts_at: new Date("2026-04-10T10:15:00.000Z"),
      ends_at: new Date("2026-04-10T10:45:00.000Z")
    }

    expect(hasAppointmentOverlap(existingSlot, candidateSlot)).toBe(true)
  })

  it("detects overlap when a slot fully wraps another slot", () => {
    const candidateSlot = {
      starts_at: new Date("2026-04-10T09:45:00.000Z"),
      ends_at: new Date("2026-04-10T10:45:00.000Z")
    }

    expect(hasAppointmentOverlap(existingSlot, candidateSlot)).toBe(true)
  })

  it("does not treat back-to-back slots as overlap", () => {
    const candidateSlot = {
      starts_at: new Date("2026-04-10T10:30:00.000Z"),
      ends_at: new Date("2026-04-10T11:00:00.000Z")
    }

    expect(hasAppointmentOverlap(existingSlot, candidateSlot)).toBe(false)
  })

  it("builds a query that only matches scheduled, non-deleted overlaps", () => {
    const starts_at = new Date("2026-04-10T10:15:00.000Z")
    const ends_at = new Date("2026-04-10T10:45:00.000Z")

    expect(buildScheduledAppointmentConflictWhere("doctor_id", "doctor-1", { starts_at, ends_at })).toEqual({
      doctor_id: "doctor-1",
      status: AppointmentStatus.SCHEDULED,
      deleted_at: null,
      starts_at: {
        lt: ends_at
      },
      ends_at: {
        gt: starts_at
      }
    })
  })

  it("can build the same overlap query for a patient", () => {
    const starts_at = new Date("2026-04-10T10:15:00.000Z")
    const ends_at = new Date("2026-04-10T10:45:00.000Z")

    expect(buildScheduledAppointmentConflictWhere("patient_id", "patient-1", { starts_at, ends_at })).toEqual({
      patient_id: "patient-1",
      status: AppointmentStatus.SCHEDULED,
      deleted_at: null,
      starts_at: {
        lt: ends_at
      },
      ends_at: {
        gt: starts_at
      }
    })
  })
})
