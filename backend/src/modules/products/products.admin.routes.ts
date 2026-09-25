import { raw, Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { MAX_IMAGE_FILE_BYTES } from '../../media/upload-limits.js'
import {
  publicProductMediaParamsSchema,
  publicProductParamsSchema,
} from './products.schemas.js'
import {
  createAdminProductController,
  createProductReferenceController,
  deleteAdminProductController,
  getAdminProductController,
  getAdminProductReferencesController,
  listAdminProductsController,
  updateAdminProductController,
  getAdminProductMediaController,
  uploadAdminProductMediaController,
} from './products.admin.controller.js'
import {
  createAdminProductBodySchema,
  createProductReferenceBodySchema,
  updateAdminProductBodySchema,
} from './products.admin.schemas.js'

export const adminProductsRouter = Router()

adminProductsRouter.get('/references', getAdminProductReferencesController)

adminProductsRouter.get('/', listAdminProductsController)

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

adminProductsRouter.post(
  '/:productId/media',
  validateRequest({
    params: publicProductParamsSchema,
  }),
  raw({
    type: () => true,
    limit: MAX_IMAGE_FILE_BYTES,
  }),
  uploadAdminProductMediaController,
)

adminProductsRouter.get(
  '/:productId/media/:mediaId',
  validateRequest({
    params: publicProductMediaParamsSchema,
  }),
  getAdminProductMediaController,
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
