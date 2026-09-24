import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { convertReservationStoreSaleController } from './reservations.admin.controller.js'
import { convertReservationStoreSaleParamsSchema } from './reservations.admin.schemas.js'

export const adminReservationsRouter = Router()

adminReservationsRouter.post(
  '/:reservationId/store-sale',
  validateRequest({
    params: convertReservationStoreSaleParamsSchema,
  }),
  convertReservationStoreSaleController,
)
