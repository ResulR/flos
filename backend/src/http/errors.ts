export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR'
  | 'PRODUCT_NOT_AVAILABLE'
  | 'RESERVATION_EXPIRED'
  | 'RESERVATION_ACCESS_DENIED'

export type AppErrorFields = Record<string, string>

export class AppError extends Error {
  readonly statusCode: number
  readonly code: AppErrorCode
  readonly fields?: AppErrorFields

  constructor(
    statusCode: number,
    code: AppErrorCode,
    message: string,
    fields?: AppErrorFields,
  ) {
    super(message)

    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.fields = fields
  }
}
