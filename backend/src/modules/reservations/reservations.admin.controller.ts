import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import { convertReservationToStoreSale } from '../orders/orders.service.js'
import { cancelReservationManually } from './reservations.service.js'
import type {
  CancelReservationParams,
  ConvertReservationStoreSaleParams,
} from './reservations.admin.schemas.js'

export const convertReservationStoreSaleController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { reservationId } = res.locals.validated
    .params as ConvertReservationStoreSaleParams

  const sale = await convertReservationToStoreSale(reservationId)

  res.status(201).json({
    data: sale,
  })
}

export const cancelReservationController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { reservationId } = res.locals.validated
    .params as CancelReservationParams

  const reservation = await cancelReservationManually(reservationId)

  res.status(200).json({
    data: reservation,
  })
}
