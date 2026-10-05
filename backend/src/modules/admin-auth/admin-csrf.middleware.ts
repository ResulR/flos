import type { Request, RequestHandler } from 'express'

import { AppError } from '../../http/errors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const CSRF_ERROR_MESSAGE = 'Origine de la requête administrateur non autorisée.'

function getExpectedOrigin(req: Request) {
  const forwardedHost = req.get('x-forwarded-host')

  if (!forwardedHost || forwardedHost.includes(',')) {
    return null
  }

  try {
    return new URL(`${req.protocol}://${forwardedHost}`).origin
  } catch {
    return null
  }
}

function getRequestOrigin(req: Request) {
  const origin = req.get('origin')

  if (origin) {
    try {
      return new URL(origin).origin
    } catch {
      return null
    }
  }

  const referer = req.get('referer')

  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      return null
    }
  }

  return null
}

export const requireAdminSameOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const expectedOrigin = getExpectedOrigin(req)
  const requestOrigin = getRequestOrigin(req)

  if (!expectedOrigin || !requestOrigin || requestOrigin !== expectedOrigin) {
    next(new AppError(403, 'FORBIDDEN', CSRF_ERROR_MESSAGE))
    return
  }

  next()
}
