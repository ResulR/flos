import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  CreateAdminProductBody,
  CreateProductReferenceBody,
} from './products.admin.schemas.js'
import {
  createAdminProduct,
  createProductReference,
  getAdminProductReferences,
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
