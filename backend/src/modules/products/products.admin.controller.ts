import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { PublicProductParams } from './products.schemas.js'
import type {
  CreateAdminProductBody,
  CreateProductReferenceBody,
  UpdateAdminProductBody,
} from './products.admin.schemas.js'
import {
  createAdminProduct,
  createProductReference,
  getAdminProduct,
  getAdminProductReferences,
  updateAdminProductDetails,
} from './products.admin.service.js'

export const getAdminProductReferencesController: RequestHandler = async (
  _req,
  res,
) => {
  const references = await getAdminProductReferences()

  res.status(200).json({
    data: references,
  })
}

export const createProductReferenceController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const input = res.locals.validated.body as CreateProductReferenceBody
  const reference = await createProductReference(input)

  res.status(201).json({
    data: reference,
  })
}

export const createAdminProductController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const input = res.locals.validated.body as CreateAdminProductBody
  const product = await createAdminProduct(input)

  res.status(201).json({
    data: product,
  })
}

export const getAdminProductController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const params = res.locals.validated.params as PublicProductParams
  const product = await getAdminProduct(params.productId)

  res.status(200).json({
    data: product,
  })
}

export const updateAdminProductController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const params = res.locals.validated.params as PublicProductParams
  const input = res.locals.validated.body as UpdateAdminProductBody

  const product = await updateAdminProductDetails(params.productId, input)

  res.status(200).json({
    data: product,
  })
}
