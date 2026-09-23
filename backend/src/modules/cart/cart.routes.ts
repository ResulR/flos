import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { revalidateCartController } from './cart.controller.js'
import { revalidateCartBodySchema } from './cart.schemas.js'

export const cartRouter = Router()

cartRouter.post(
  '/revalidate',
  validateRequest({ body: revalidateCartBodySchema }),
  revalidateCartController,
)
