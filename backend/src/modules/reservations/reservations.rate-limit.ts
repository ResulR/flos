import { createIpRateLimit } from '../../http/ip-rate-limit.js'

export const RESERVATION_RATE_LIMIT_MAX_REQUESTS = 10
export const RESERVATION_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

export const reservationRateLimit = createIpRateLimit({
  maxRequests: RESERVATION_RATE_LIMIT_MAX_REQUESTS,
  windowMs: RESERVATION_RATE_LIMIT_WINDOW_MS,
  message: 'Trop de demandes de réservation. Réessayez plus tard.',
})
