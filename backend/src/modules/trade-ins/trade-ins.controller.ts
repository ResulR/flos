import type { RequestHandler } from 'express'

import { AppError } from '../../http/errors.js'
import type { ValidationLocals } from '../../http/validation.js'
import {
  tradeInUploadTokenSchema,
  type CreateTradeInInput,
  type TradeInMediaParams,
} from './trade-ins.schemas.js'
import { createTradeIn, uploadTradeInMedia } from './trade-ins.service.js'

export const createTradeInController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as CreateTradeInInput
  const tradeIn = await createTradeIn(body)

  res.status(201).json({
    data: tradeIn,
  })
}

export const uploadTradeInMediaController: RequestHandler<
  Record<string, string>,
  unknown,
  Buffer,
  unknown,
  ValidationLocals
> = async (req, res) => {
  const { tradeInId } = res.locals.validated.params as TradeInMediaParams
  const uploadToken = req.get('X-Trade-In-Upload-Token')

  const parsedToken = tradeInUploadTokenSchema.safeParse(uploadToken)

  if (!parsedToken.success) {
    throw new AppError(403, 'FORBIDDEN', 'Accès à la reprise refusé')
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Une image est requise.')
  }

  const media = await uploadTradeInMedia(tradeInId, parsedToken.data, req.body)

  res.status(201).json({
    data: media,
  })
}
