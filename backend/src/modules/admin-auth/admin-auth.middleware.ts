import type { RequestHandler } from 'express'

import { AppError } from '../../http/errors.js'
import { findActiveAdminSessionById } from './admin-auth.repository.js'
import {
  ADMIN_SESSION_COOKIE_NAME,
  getCookieValue,
  readAdminSessionToken,
} from './admin-auth.session.js'

export type AuthenticatedAdmin = {
  id: number
  email: string
}

export type AdminAuthLocals = {
  admin: AuthenticatedAdmin
}

const UNAUTHENTICATED_MESSAGE = 'Authentification administrateur requise.'

export const requireAdminSession: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  AdminAuthLocals
> = async (req, res, next) => {
  const sessionToken = getCookieValue(
    req.headers.cookie,
    ADMIN_SESSION_COOKIE_NAME,
  )

  if (!sessionToken) {
    next(new AppError(401, 'UNAUTHENTICATED', UNAUTHENTICATED_MESSAGE))
    return
  }

  const session = readAdminSessionToken(sessionToken)

  if (!session) {
    next(new AppError(401, 'UNAUTHENTICATED', UNAUTHENTICATED_MESSAGE))
    return
  }

  const admin = await findActiveAdminSessionById(
    session.adminId,
    session.sessionVersion,
  )

  if (!admin) {
    next(new AppError(401, 'UNAUTHENTICATED', UNAUTHENTICATED_MESSAGE))
    return
  }

  res.locals.admin = {
    id: admin.id,
    email: admin.email,
  }

  next()
}
