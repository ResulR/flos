import { z } from 'zod'

export const updateTradeInStatusParamsSchema = z
  .object({
    tradeInId: z.string().regex(/^[1-9]\d*$/, 'Reprise invalide'),
  })
  .strict()

export const updateTradeInStatusBodySchema = z
  .object({
    status: z.enum(['reviewing', 'accepted', 'rejected']),
  })
  .strict()

export type UpdateTradeInStatusParams = z.infer<
  typeof updateTradeInStatusParamsSchema
>

export type UpdateTradeInStatusBody = z.infer<
  typeof updateTradeInStatusBodySchema
>

export const updateTradeInOfferParamsSchema = updateTradeInStatusParamsSchema

export const updateTradeInOfferBodySchema = z
  .object({
    offeredPriceCents: z
      .number()
      .int('Prix proposé invalide')
      .nonnegative('Prix proposé invalide'),
  })
  .strict()

export type UpdateTradeInOfferParams = z.infer<
  typeof updateTradeInOfferParamsSchema
>

export type UpdateTradeInOfferBody = z.infer<
  typeof updateTradeInOfferBodySchema
>
