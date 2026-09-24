import { Router } from 'express'

import { getAdminSiteSettingsController } from './site-settings.admin.controller.js'

export const adminSiteSettingsRouter = Router()

adminSiteSettingsRouter.get('/', getAdminSiteSettingsController)
