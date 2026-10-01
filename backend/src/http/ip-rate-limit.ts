import type { RequestHandler } from 'express'

import { AppError } from './errors.js'

type IpRateLimitOptions = {
  maxRequests: number
  windowMs: number
  message: string
}

type IpRateLimitEntry = {
  requests: number
  resetAt: number
}

export function createIpRateLimit({
  maxRequests,
  windowMs,
  message,
}: IpRateLimitOptions): RequestHandler {
  const requestsByIp = new Map<string, IpRateLimitEntry>()
  let nextCleanupAt = Date.now() + windowMs

  function cleanupExpiredEntries(now: number) {
    if (now < nextCleanupAt) {
      return
    }

    for (const [ip, entry] of requestsByIp) {
      if (entry.resetAt <= now) {
        requestsByIp.delete(ip)
      }
    }

    nextCleanupAt = now + windowMs
  }

  return (req, res, next) => {
    const now = Date.now()

    cleanupExpiredEntries(now)

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const current = requestsByIp.get(ip)

    if (!current || current.resetAt <= now) {
      requestsByIp.set(ip, {
        requests: 1,
        resetAt: now + windowMs,
      })

      next()
      return
    }

    if (current.requests >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      )

      res.setHeader('Retry-After', String(retryAfterSeconds))

      next(new AppError(429, 'RATE_LIMITED', message))
      return
    }

    current.requests += 1
    next()
  }
}
