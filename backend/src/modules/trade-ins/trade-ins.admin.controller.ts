import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  TradeInInternalNoteParams,
  UpdateTradeInInternalNoteBody,
  UpdateTradeInOfferBody,
  UpdateTradeInOfferParams,
  UpdateTradeInStatusBody,
  UpdateTradeInStatusParams,
} from './trade-ins.admin.schemas.js'
import {
  getTradeInInternalNote,
  listAdminTradeIns,
  setTradeInInternalNote,
  setTradeInOffer,
  updateTradeInStatus,
} from './trade-ins.service.js'

export const updateTradeInStatusController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { tradeInId } = res.locals.validated.params as UpdateTradeInStatusParams
  const { status } = res.locals.validated.body as UpdateTradeInStatusBody

  const tradeIn = await updateTradeInStatus(tradeInId, status)

  res.status(200).json({
    data: tradeIn,
  })
}

export const updateTradeInOfferController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { tradeInId } = res.locals.validated.params as UpdateTradeInOfferParams
  const { offeredPriceCents } = res.locals.validated
    .body as UpdateTradeInOfferBody

  const tradeIn = await setTradeInOffer(tradeInId, offeredPriceCents)

  res.status(200).json({
    data: tradeIn,
  })
}

export const getTradeInInternalNoteController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { tradeInId } = res.locals.validated.params as TradeInInternalNoteParams

  const tradeIn = await getTradeInInternalNote(tradeInId)

  res.status(200).json({
    data: tradeIn,
  })
}

export const updateTradeInInternalNoteController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const { tradeInId } = res.locals.validated.params as TradeInInternalNoteParams
  const { internalNote } = res.locals.validated
    .body as UpdateTradeInInternalNoteBody

  const tradeIn = await setTradeInInternalNote(tradeInId, internalNote)

  res.status(200).json({
    data: tradeIn,
  })
}

export const listAdminTradeInsController: RequestHandler = async (
  _req,
  res,
) => {
  const tradeIns = await listAdminTradeIns()

  res.status(200).json({
    data: tradeIns,
  })
}
