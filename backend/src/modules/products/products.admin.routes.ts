import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { publicProductParamsSchema } from './products.schemas.js'
import {
  createAdminProductController,
  createProductReferenceController,
  deleteAdminProductController,
  getAdminProductController,
  getAdminProductReferencesController,
  updateAdminProductController,
} from './products.admin.controller.js'
import {
  createAdminProductBodySchema,
  createProductReferenceBodySchema,
  updateAdminProductBodySchema,
} from './products.admin.schemas.js'

export const adminProductsRouter = Router()

adminProductsRouter.get('/references', getAdminProductReferencesController)

adminProductsRouter.post(
  '/references',
  validateRequest({
    body: createProductReferenceBodySchema,
  }),
  createProductReferenceController,
)

adminProductsRouter.post(
  '/',
  validateRequest({
    body: createAdminProductBodySchema,
  }),
  createAdminProductController,
)

adminProductsRouter.get(
  '/:productId',
  validateRequest({
    params: publicProductParamsSchema,
  }),
  getAdminProductController,
)

adminProductsRouter.patch(
  '/:productId',
  validateRequest({
    params: publicProductParamsSchema,
    body: updateAdminProductBodySchema,
  }),
  updateAdminProductController,
)

adminProductsRouter.delete(
  '/:productId',
  validateRequest({
    params: publicProductParamsSchema,
  }),
  deleteAdminProductController,
)
