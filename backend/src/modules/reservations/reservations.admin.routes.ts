import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  cancelReservationController,
  convertReservationStoreSaleController,
  listAdminReservationsController,
} from './reservations.admin.controller.js'
import {
  cancelReservationParamsSchema,
  convertReservationStoreSaleParamsSchema,
} from './reservations.admin.schemas.js'

export const adminReservationsRouter = Router()

adminReservationsRouter.get('/', listAdminReservationsController)

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
