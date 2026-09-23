import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { CreateTradeInInput } from './trade-ins.schemas.js'
import { createTradeIn } from './trade-ins.service.js'

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
