import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  createDraftOrderController,
  getPublicOrderTrackingController,
} from './orders.controller.js'
import {
  createDraftOrderBodySchema,
  publicOrderTrackingParamsSchema,
} from './orders.schemas.js'

export const ordersRouter = Router()

ordersRouter.get(
  '/tracking/:trackingToken',
  validateRequest({ params: publicOrderTrackingParamsSchema }),
  getPublicOrderTrackingController,
)

ordersRouter.post(
  '/',
  validateRequest({ body: createDraftOrderBodySchema }),
  createDraftOrderController,
)
