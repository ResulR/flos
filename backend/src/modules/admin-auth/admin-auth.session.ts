import { createHmac } from 'node:crypto'

import { env } from '../../config/env.js'

export const ADMIN_SESSION_COOKIE_NAME = 'flos_bikes_admin_session'
export const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000

type AdminSessionPayload = {
  adminId: number
  sessionVersion: number
  expiresAt: number
}

function sign(value: string) {
  return createHmac('sha256', env.SESSION_SECRET)
    .update(value)
    .digest('base64url')
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

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.ADMIN_COOKIE_SECURE,
  path: '/api/admin',
  maxAge: ADMIN_SESSION_MAX_AGE_MS,
}
