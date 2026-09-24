import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  cancelReservationController,
  convertReservationStoreSaleController,
} from './reservations.admin.controller.js'
import {
  cancelReservationParamsSchema,
  convertReservationStoreSaleParamsSchema,
} from './reservations.admin.schemas.js'

export const adminReservationsRouter = Router()

adminReservationsRouter.post(
  '/:reservationId/store-sale',
  validateRequest({
    params: convertReservationStoreSaleParamsSchema,
  }),
  convertReservationStoreSaleController,
)

adminReservationsRouter.post(
  '/:reservationId/cancel',
  validateRequest({
    params: cancelReservationParamsSchema,
  }),
  cancelReservationController,
)
