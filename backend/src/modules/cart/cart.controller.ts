import type { RequestHandler } from 'express'

import type { ValidationLocals } from '../../http/validation.js'
import type { RevalidateCartBody } from './cart.schemas.js'
import { revalidateCart } from './cart.service.js'

export const revalidateCartController: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> = async (_req, res) => {
  const body = res.locals.validated.body as RevalidateCartBody
  const cart = await revalidateCart(body)

  res.status(200).json({
    data: cart,
  })
}
