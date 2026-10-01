import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { createReservationController } from './reservations.controller.js'
import { reservationRateLimit } from './reservations.rate-limit.js'
import { createReservationSchema } from './reservations.schemas.js'

export const reservationsRouter = Router()

reservationsRouter.post(
  '/',
  reservationRateLimit,
  validateRequest({ body: createReservationSchema }),
  createReservationController,
)
