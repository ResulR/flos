import type { ApiErrorCode, ApiFieldErrors } from '@flos-bikes/contracts'

export type ApiClientErrorKind = 'http' | 'network' | 'invalid_response'

type ApiClientErrorOptions = {
  kind: ApiClientErrorKind
  message: string
  status?: number
  code?: ApiErrorCode
  fields?: ApiFieldErrors
  cause?: unknown
}

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind
  readonly status?: number
  readonly code?: ApiErrorCode
  readonly fields?: ApiFieldErrors

  constructor({
    kind,
    message,
    status,
    code,
    fields,
    cause,
  }: ApiClientErrorOptions) {
    super(message, { cause })

    this.name = 'ApiClientError'
    this.kind = kind
    this.status = status
    this.code = code
    this.fields = fields
  }
}
