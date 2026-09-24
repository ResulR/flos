import type { RequestHandler } from 'express'

import { getAdminDashboard } from './admin-dashboard.service.js'

export const getAdminDashboardController: RequestHandler = async (
  _req,
  res,
) => {
  const dashboard = await getAdminDashboard()

  res.status(200).json({
    data: dashboard,
  })
}
