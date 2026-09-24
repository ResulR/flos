import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  getAdminOrderController,
  listAdminOrdersController,
} from './orders.admin.controller.js'
import { adminOrderParamsSchema } from './orders.admin.schemas.js'

export const adminOrdersRouter = Router()

adminOrdersRouter.get('/', listAdminOrdersController)

adminOrdersRouter.get(
  '/:orderId',
  validateRequest({
    params: adminOrderParamsSchema,
  }),
  getAdminOrderController,
)
