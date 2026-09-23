import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  CreateDraftOrderBody,
  CreateReservationOrderBody,
  PublicOrderTrackingParams,
} from './orders.schemas.js'
import {
  createDraftOrder,
  createOrderFromReservation,
  getPublicOrderTracking,
} from './orders.service.js'

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

export const createReservationOrderController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as CreateReservationOrderBody
  const order = await createOrderFromReservation(body)

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
