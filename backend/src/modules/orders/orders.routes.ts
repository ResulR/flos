import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  createDraftOrderController,
  createReservationOrderController,
  getPublicOrderTrackingController,
} from './orders.controller.js'
import {
  createDraftOrderBodySchema,
  createReservationOrderBodySchema,
  publicOrderTrackingParamsSchema,
} from './orders.schemas.js'

export const ordersRouter = Router()

ordersRouter.get(
  '/tracking/:trackingToken',
  validateRequest({ params: publicOrderTrackingParamsSchema }),
  getPublicOrderTrackingController,
)

ordersRouter.post(
  '/from-reservation',
  validateRequest({ body: createReservationOrderBodySchema }),
  createReservationOrderController,
)

ordersRouter.post(
  '/',
  validateRequest({ body: createDraftOrderBodySchema }),
  createDraftOrderController,
)
