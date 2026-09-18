import type { RequestHandler } from 'express'

import { listPublicProducts } from './products.service.js'

export const getPublicProducts: RequestHandler = async (_req, res) => {
  const products = await listPublicProducts()

  res.status(200).json({
    data: products,
  })
}
