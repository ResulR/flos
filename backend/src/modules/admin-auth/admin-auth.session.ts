import { createHmac, timingSafeEqual } from 'node:crypto'

import { env } from '../../config/env.js'

export const ADMIN_SESSION_COOKIE_NAME = 'flos_bikes_admin_session'
export const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000

export type AdminSessionPayload = {
  adminId: number
  sessionVersion: number
  expiresAt: number
}

function sign(value: string) {
  return createHmac('sha256', env.SESSION_SECRET)
    .update(value)
    .digest('base64url')
}

function signaturesMatch(actual: string, expected: string) {
  let actualBuffer: Buffer
  let expectedBuffer: Buffer

  try {
    actualBuffer = Buffer.from(actual, 'base64url')
    expectedBuffer = Buffer.from(expected, 'base64url')
  } catch {
    return false
  }

  if (
    actualBuffer.length === 0 ||
    actualBuffer.length !== expectedBuffer.length
  ) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

function isAdminSessionPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const adminId = Reflect.get(value, 'adminId')
  const sessionVersion = Reflect.get(value, 'sessionVersion')
  const expiresAt = Reflect.get(value, 'expiresAt')

  return (
    Number.isSafeInteger(adminId) &&
    Number(adminId) > 0 &&
    Number.isSafeInteger(sessionVersion) &&
    Number(sessionVersion) >= 1 &&
    typeof expiresAt === 'number' &&
    Number.isFinite(expiresAt)
  )
}

export function createAdminSessionToken({
  adminId,
  sessionVersion,
}: {
  adminId: number
  sessionVersion: number
}) {
  const payload: AdminSessionPayload = {
    adminId,
    sessionVersion,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_MS,
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  )

  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function readAdminSessionToken(
  token: string,
): AdminSessionPayload | null {
  const separatorIndex = token.indexOf('.')

  if (
    separatorIndex <= 0 ||
    separatorIndex === token.length - 1 ||
    token.indexOf('.', separatorIndex + 1) !== -1
  ) {
    return null
  }

  const encodedPayload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)

  if (!signaturesMatch(signature, sign(encodedPayload))) {
    return null
  }

  let payload: unknown

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    )
  } catch {
    return null
  }

  if (!isAdminSessionPayload(payload)) {
    return null
  }

  if (payload.expiresAt <= Date.now()) {
    return null
  }

  return payload
}

export function getCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
) {
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const name = part.slice(0, separatorIndex).trim()

    if (name !== cookieName) {
      continue
    }

    return part.slice(separatorIndex + 1).trim() || null
  }

  return null
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.ADMIN_COOKIE_SECURE,
  path: '/api/admin',
  maxAge: ADMIN_SESSION_MAX_AGE_MS,
}

export const adminSessionClearCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.ADMIN_COOKIE_SECURE,
  path: '/api/admin',
}
