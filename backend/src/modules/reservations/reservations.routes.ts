import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { createReservationController } from './reservations.controller.js'
import { createReservationSchema } from './reservations.schemas.js'

export const reservationsRouter = Router()

reservationsRouter.post(
  '/',
  validateRequest({ body: createReservationSchema }),
  createReservationController,
)
