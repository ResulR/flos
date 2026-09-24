import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type {
  UpdateTradeInStatusBody,
  UpdateTradeInStatusParams,
} from './trade-ins.admin.schemas.js'
import { updateTradeInStatus } from './trade-ins.service.js'

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
