import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { AdminLoginInput } from './admin-auth.schemas.js'
import { loginAdmin } from './admin-auth.service.js'
import {
  ADMIN_SESSION_COOKIE_NAME,
  adminSessionCookieOptions,
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
