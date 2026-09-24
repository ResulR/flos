import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { UpdateAdminSiteSettingsBody } from './site-settings.admin.schemas.js'
import {
  getPublicSiteSettings,
  updateAdminSiteSettings,
} from './site-settings.service.js'

export const getAdminSiteSettingsController: RequestHandler = async (
  _req,
  res,
) => {
  const settings = await getPublicSiteSettings()

  res.status(200).json({
    data: settings,
  })
}

export const updateAdminSiteSettingsController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const input = res.locals.validated.body as UpdateAdminSiteSettingsBody
  const settings = await updateAdminSiteSettings(input)

  res.status(200).json({
    data: settings,
  })
}
