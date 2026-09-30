import { raw, Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import { MAX_IMAGE_FILE_BYTES } from '../../media/upload-limits.js'
import {
  createTradeInController,
  uploadTradeInMediaController,
} from './trade-ins.controller.js'
import {
  createTradeInSchema,
  tradeInMediaParamsSchema,
} from './trade-ins.schemas.js'

export const tradeInsRouter = Router()

tradeInsRouter.post(
  '/',
  validateRequest({ body: createTradeInSchema }),
  createTradeInController,
)

tradeInsRouter.post(
  '/:tradeInId/media',
  validateRequest({
    params: tradeInMediaParamsSchema,
  }),
  raw({
    type: () => true,
    limit: MAX_IMAGE_FILE_BYTES,
  }),
  uploadTradeInMediaController,
)
