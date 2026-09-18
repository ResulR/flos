import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  getPublicProductById,
  getPublicProductMedia,
  getPublicProducts,
} from './products.controller.js'
import {
  publicProductFiltersSchema,
  publicProductMediaParamsSchema,
  publicProductParamsSchema,
} from './products.schemas.js'

export const productsRouter = Router()

productsRouter.get(
  '/',
  validateRequest({ query: publicProductFiltersSchema }),
  getPublicProducts,
)

productsRouter.get(
  '/:productId/media/:mediaId',
  validateRequest({ params: publicProductMediaParamsSchema }),
  getPublicProductMedia,
)

productsRouter.get(
  '/:productId',
  validateRequest({ params: publicProductParamsSchema }),
  getPublicProductById,
)
