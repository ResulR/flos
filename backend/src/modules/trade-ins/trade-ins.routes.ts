import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { createTradeInController } from './trade-ins.controller.js'
import { createTradeInSchema } from './trade-ins.schemas.js'

export const tradeInsRouter = Router()

tradeInsRouter.post(
  '/',
  validateRequest({ body: createTradeInSchema }),
  createTradeInController,
)
