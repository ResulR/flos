import type { RequestHandler } from 'express'

import { AppError } from '../../http/errors.js'

export const ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5
export const ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

type LoginRateLimitEntry = {
  attempts: number
  resetAt: number
}

const attemptsByIp = new Map<string, LoginRateLimitEntry>()
let nextCleanupAt = Date.now() + ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS

function cleanupExpiredEntries(now: number) {
  if (now < nextCleanupAt) {
    return
  }

  for (const [ip, entry] of attemptsByIp) {
    if (entry.resetAt <= now) {
      attemptsByIp.delete(ip)
    }
  }

  nextCleanupAt = now + ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS
}

function registerSuccessfulLoginReset(
  ip: string,
  response: Parameters<RequestHandler>[1],
) {
  response.once('finish', () => {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      attemptsByIp.delete(ip)
    }
  })
}

export const adminLoginRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now()

  cleanupExpiredEntries(now)

  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  const current = attemptsByIp.get(ip)

  if (!current || current.resetAt <= now) {
    attemptsByIp.set(ip, {
      attempts: 1,
      resetAt: now + ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS,
    })

    registerSuccessfulLoginReset(ip, res)
    next()
    return
  }

  if (current.attempts >= ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    )

    res.setHeader('Retry-After', String(retryAfterSeconds))

    next(
      new AppError(
        429,
        'RATE_LIMITED',
        'Trop de tentatives de connexion. Réessayez plus tard.',
      ),
    )
    return
  }

  current.attempts += 1

  registerSuccessfulLoginReset(ip, res)
  next()
}
