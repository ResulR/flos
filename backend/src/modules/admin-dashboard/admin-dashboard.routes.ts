import { Router } from 'express'

import { getAdminDashboardController } from './admin-dashboard.controller.js'

export const adminDashboardRouter = Router()

adminDashboardRouter.get('/', getAdminDashboardController)
