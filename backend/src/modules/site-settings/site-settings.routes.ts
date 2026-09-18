import { Router } from 'express'

import { getPublicSiteSettingsController } from './site-settings.controller.js'

export const siteSettingsRouter = Router()

siteSettingsRouter.get('/public', getPublicSiteSettingsController)
