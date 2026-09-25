import type { RequestHandler } from 'express'

import { AppError } from '../../http/errors.js'
import type { ValidationLocals } from '../../http/validation.js'
import type {
  PublicProductMediaParams,
  PublicProductParams,
} from './products.schemas.js'
import type {
  CreateAdminProductBody,
  CreateProductReferenceBody,
  UpdateAdminProductBody,
} from './products.admin.schemas.js'
import {
  createAdminProduct,
  createProductReference,
  deleteAdminProduct,
  getAdminProduct,
  getAdminProductReferences,
  getAdminProductMediaFile,
  listAdminProducts,
  updateAdminProductDetails,
  uploadAdminProductMedia,
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

export const deleteAdminProductController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const params = res.locals.validated.params as PublicProductParams
  const product = await deleteAdminProduct(params.productId)

  res.status(200).json({
    data: product,
  })
}

export const listAdminProductsController: RequestHandler = async (
  _req,
  res,
) => {
  const products = await listAdminProducts()

  res.status(200).json({
    data: products,
  })
}

export const uploadAdminProductMediaController: RequestHandler<
  Record<string, string>,
  unknown,
  Buffer,
  unknown,
  ValidationLocals
> = async (req, res) => {
  const params = res.locals.validated.params as PublicProductParams

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Une image est requise.')
  }

  const media = await uploadAdminProductMedia(params.productId, req.body)

  res.status(201).json({
    data: media,
  })
}

export const getAdminProductMediaController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const params = res.locals.validated.params as PublicProductMediaParams

  const media = await getAdminProductMediaFile(params.productId, params.mediaId)

  res.sendFile(media.absolutePath)
}
