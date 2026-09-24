import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { updateTradeInStatusController } from './trade-ins.admin.controller.js'
import {
  updateTradeInStatusBodySchema,
  updateTradeInStatusParamsSchema,
} from './trade-ins.admin.schemas.js'

export const adminTradeInsRouter = Router()

adminTradeInsRouter.patch(
  '/:tradeInId/status',
  validateRequest({
    params: updateTradeInStatusParamsSchema,
    body: updateTradeInStatusBodySchema,
  }),
  updateTradeInStatusController,
)
