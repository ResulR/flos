import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { AdminOrderParams } from './orders.admin.schemas.js'
import { getAdminOrder, listAdminOrders } from './orders.admin.service.js'

export const listAdminOrdersController: RequestHandler = async (_req, res) => {
  const orders = await listAdminOrders()

  res.status(200).json({
    data: orders,
  })
}

export const getAdminOrderController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const params = res.locals.validated.params as AdminOrderParams
  const order = await getAdminOrder(params.orderId)

  res.status(200).json({
    data: order,
  })
}
