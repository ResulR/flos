import type { RequestHandler } from 'express'

import { getPublicSiteSettings } from './site-settings.service.js'

export const getAdminSiteSettingsController: RequestHandler = async (
  _req,
  res,
) => {
  const settings = await getPublicSiteSettings()

  res.status(200).json({
    data: settings,
  })
}
