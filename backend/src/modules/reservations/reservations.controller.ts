import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { CreateReservationInput } from './reservations.schemas.js'
import { createReservation } from './reservations.service.js'

export const createReservationController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as CreateReservationInput
  const reservation = await createReservation(body)

  res.status(201).json({
    data: reservation,
  })
}
