import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  getAdminSiteSettingsController,
  updateAdminSiteSettingsController,
} from './site-settings.admin.controller.js'
import { updateAdminSiteSettingsBodySchema } from './site-settings.admin.schemas.js'

export const adminSiteSettingsRouter = Router()

adminSiteSettingsRouter.get('/', getAdminSiteSettingsController)

adminSiteSettingsRouter.patch(
  '/',
  validateRequest({
    body: updateAdminSiteSettingsBodySchema,
  }),
  updateAdminSiteSettingsController,
)
