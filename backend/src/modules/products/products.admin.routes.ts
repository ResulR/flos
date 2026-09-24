import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  createAdminProductController,
  createProductReferenceController,
  getAdminProductReferencesController,
} from './products.admin.controller.js'
import {
  createAdminProductBodySchema,
  createProductReferenceBodySchema,
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
