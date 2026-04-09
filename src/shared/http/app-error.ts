import { StatusCodes } from "http-status-codes"

export class AppError extends Error {
  constructor(
    public readonly statusCode: StatusCodes,
    public readonly errorCode: string,
    public readonly messageKey: string,
    public readonly details?: unknown
  ) {
    super(messageKey)
  }
}
