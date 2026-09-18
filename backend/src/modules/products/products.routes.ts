import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  getPublicProductById,
  getPublicProductFilters,
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

productsRouter.get('/filters', getPublicProductFilters)

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
