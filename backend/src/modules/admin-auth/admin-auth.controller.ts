import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { AdminLoginInput } from './admin-auth.schemas.js'
import { loginAdmin, logoutAdmin } from './admin-auth.service.js'
import {
  ADMIN_SESSION_COOKIE_NAME,
  adminSessionClearCookieOptions,
  adminSessionCookieOptions,
  getCookieValue,
} from './admin-auth.session.js'

export const adminLoginController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as AdminLoginInput
  const result = await loginAdmin(body)

  res.cookie(
    ADMIN_SESSION_COOKIE_NAME,
    result.sessionToken,
    adminSessionCookieOptions,
  )

  res.status(200).json({
    data: {
      authenticated: true,
    },
  })
}

export const adminLogoutController: RequestHandler = async (req, res) => {
  const sessionToken = getCookieValue(
    req.headers.cookie,
    ADMIN_SESSION_COOKIE_NAME,
  )

  await logoutAdmin(sessionToken)

  res.clearCookie(ADMIN_SESSION_COOKIE_NAME, adminSessionClearCookieOptions)

  res.status(200).json({
    data: {
      authenticated: false,
    },
  })
}
