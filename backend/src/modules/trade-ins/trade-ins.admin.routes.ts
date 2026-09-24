import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  getAdminTradeInController,
  getTradeInInternalNoteController,
  listAdminTradeInsController,
  updateTradeInInternalNoteController,
  updateTradeInOfferController,
  updateTradeInStatusController,
} from './trade-ins.admin.controller.js'
import {
  adminTradeInParamsSchema,
  tradeInInternalNoteParamsSchema,
  updateTradeInInternalNoteBodySchema,
  updateTradeInOfferBodySchema,
  updateTradeInOfferParamsSchema,
  updateTradeInStatusBodySchema,
  updateTradeInStatusParamsSchema,
} from './trade-ins.admin.schemas.js'

export const adminTradeInsRouter = Router()

adminTradeInsRouter.get('/', listAdminTradeInsController)

adminTradeInsRouter.get(
  '/:tradeInId',
  validateRequest({
    params: adminTradeInParamsSchema,
  }),
  getAdminTradeInController,
)

adminTradeInsRouter.patch(
  '/:tradeInId/status',
  validateRequest({
    params: updateTradeInStatusParamsSchema,
    body: updateTradeInStatusBodySchema,
  }),
  updateTradeInStatusController,
)

adminTradeInsRouter.patch(
  '/:tradeInId/offer',
  validateRequest({
    params: updateTradeInOfferParamsSchema,
    body: updateTradeInOfferBodySchema,
  }),
  updateTradeInOfferController,
)

adminTradeInsRouter.get(
  '/:tradeInId/internal-note',
  validateRequest({
    params: tradeInInternalNoteParamsSchema,
  }),
  getTradeInInternalNoteController,
)

adminTradeInsRouter.patch(
  '/:tradeInId/internal-note',
  validateRequest({
    params: tradeInInternalNoteParamsSchema,
    body: updateTradeInInternalNoteBodySchema,
  }),
  updateTradeInInternalNoteController,
)
