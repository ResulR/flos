export type ApiSuccess<T> = {
  data: T
}

export type ApiFieldErrors = Record<string, string>

export type ApiErrorCode =
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

export type ApiError = {
  error: {
    code: ApiErrorCode
    message: string
    fields?: ApiFieldErrors
  }
}
