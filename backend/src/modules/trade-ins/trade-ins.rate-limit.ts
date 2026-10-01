import { createIpRateLimit } from '../../http/ip-rate-limit.js'

export const TRADE_IN_CREATE_RATE_LIMIT_MAX_REQUESTS = 5
export const TRADE_IN_CREATE_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000

export const TRADE_IN_MEDIA_RATE_LIMIT_MAX_REQUESTS = 30
export const TRADE_IN_MEDIA_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

export const tradeInCreateRateLimit = createIpRateLimit({
  maxRequests: TRADE_IN_CREATE_RATE_LIMIT_MAX_REQUESTS,
  windowMs: TRADE_IN_CREATE_RATE_LIMIT_WINDOW_MS,
  message: 'Trop de demandes de reprise. Réessayez plus tard.',
})

export const tradeInMediaRateLimit = createIpRateLimit({
  maxRequests: TRADE_IN_MEDIA_RATE_LIMIT_MAX_REQUESTS,
  windowMs: TRADE_IN_MEDIA_RATE_LIMIT_WINDOW_MS,
  message: 'Trop d’envois de photos. Réessayez plus tard.',
})
