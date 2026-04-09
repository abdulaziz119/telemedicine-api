export function serializeDate(value: Date): string {
  return value.toISOString()
}

export function serializeNullableDate(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function serializeAuditFields(entity: {
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  created_by?: string | null
  updated_by?: string | null
}) {
  return {
    created_by: entity.created_by ?? null,
    updated_by: entity.updated_by ?? null,
    created_at: serializeDate(entity.created_at),
    updated_at: serializeDate(entity.updated_at),
    deleted_at: serializeNullableDate(entity.deleted_at)
  }
}
