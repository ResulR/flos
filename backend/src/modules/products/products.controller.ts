import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  PublicProductFilters,
  PublicProductMediaParams,
  PublicProductParams,
} from './products.schemas.js'
import {
  getPublicProduct,
  getPublicProductMediaFile,
  listPublicProducts,
} from './products.service.js'

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

export const getPublicProductById: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { productId } = res.locals.validated.params as PublicProductParams
  const product = await getPublicProduct(productId)

  res.status(200).json({
    data: product,
  })
}

export const getPublicProductMedia: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { productId, mediaId } = res.locals.validated
    .params as PublicProductMediaParams

  const media = await getPublicProductMediaFile(productId, mediaId)

  res.sendFile(media.absolutePath)
}
