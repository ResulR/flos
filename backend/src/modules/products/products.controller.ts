import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { PublicProductFilters } from './products.schemas.js'
import { listPublicProducts } from './products.service.js'

export const getPublicProducts: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const filters = res.locals.validated.query as PublicProductFilters
  const products = await listPublicProducts(filters)

  res.status(200).json({
    data: products,
  })
}
