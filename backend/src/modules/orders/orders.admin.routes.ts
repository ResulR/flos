import { Router } from 'express'

import { listAdminOrdersController } from './orders.admin.controller.js'

export const adminOrdersRouter = Router()

adminOrdersRouter.get('/', listAdminOrdersController)
