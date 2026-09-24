import type { RequestHandler } from 'express'

import { listAdminOrders } from './orders.admin.service.js'

export const listAdminOrdersController: RequestHandler = async (_req, res) => {
  const orders = await listAdminOrders()

  res.status(200).json({
    data: orders,
  })
}
