import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { createDraftOrderController } from './orders.controller.js'
import { createDraftOrderBodySchema } from './orders.schemas.js'

export const ordersRouter = Router()

ordersRouter.post(
  '/',
  validateRequest({ body: createDraftOrderBodySchema }),
  createDraftOrderController,
)
