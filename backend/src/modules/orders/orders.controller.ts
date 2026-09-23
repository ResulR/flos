import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  CreateDraftOrderBody,
  PublicOrderTrackingParams,
} from './orders.schemas.js'
import { createDraftOrder, getPublicOrderTracking } from './orders.service.js'

export const createDraftOrderController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as CreateDraftOrderBody
  const order = await createDraftOrder(body)

  res.status(201).json({
    data: order,
  })
}

export const getPublicOrderTrackingController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { trackingToken } = res.locals.validated
    .params as PublicOrderTrackingParams

  const order = await getPublicOrderTracking(trackingToken)

  res.status(200).json({
    data: order,
  })
}
