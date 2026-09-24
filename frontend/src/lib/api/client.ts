import type { ApiError, ApiSuccess } from '@flos-bikes/contracts'

import { buildApiUrl } from './config'
import { ApiClientError } from './error'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null
}

function isJsonBody(body: ApiRequestOptions['body']) {
  return (
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ArrayBuffer)
  )
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') return false

  const error = Reflect.get(value, 'error')

  return (
    !!error &&
    typeof error === 'object' &&
    typeof Reflect.get(error, 'code') === 'string' &&
    typeof Reflect.get(error, 'message') === 'string'
  )
}

function redirectExpiredAdminSession(
  path: string,
  status: number,
  code?: string,
) {
  if (typeof window === 'undefined') {
    return
  }

  if (status !== 401 || code !== 'UNAUTHENTICATED') {
    return
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!normalizedPath.startsWith('/admin/')) {
    return
  }

  if (
    normalizedPath === '/admin/auth/login' ||
    normalizedPath === '/admin/auth/session'
  ) {
    return
  }

  window.location.replace('/admin/')
}

async function parseJson(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    throw new ApiClientError({
      kind: 'invalid_response',
      message: 'La réponse du serveur est invalide.',
      status: response.status,
      cause: error,
    })
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const shouldSerializeBody = isJsonBody(options.body)

  if (shouldSerializeBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      headers,
      credentials: 'include',
      body: shouldSerializeBody
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | null | undefined),
    })
  } catch (error) {
    throw new ApiClientError({
      kind: 'network',
      message: 'Impossible de contacter le serveur.',
      cause: error,
    })
  }

  const payload = await parseJson(response)

  if (!response.ok) {
    if (isApiError(payload)) {
      redirectExpiredAdminSession(path, response.status, payload.error.code)

      throw new ApiClientError({
        kind: 'http',
        message: payload.error.message,
        status: response.status,
        code: payload.error.code,
        fields: payload.error.fields,
      })
    }

    throw new ApiClientError({
      kind: 'invalid_response',
      message: 'La réponse d’erreur du serveur est invalide.',
      status: response.status,
    })
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    throw new ApiClientError({
      kind: 'invalid_response',
      message: 'La réponse du serveur est invalide.',
      status: response.status,
    })
  }

  return (payload as ApiSuccess<T>).data
}
