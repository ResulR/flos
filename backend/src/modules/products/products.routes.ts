import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { getPublicProducts } from './products.controller.js'
import { publicProductFiltersSchema } from './products.schemas.js'

export const productsRouter = Router()

productsRouter.get(
  '/',
  validateRequest({ query: publicProductFiltersSchema }),
  getPublicProducts,
)
