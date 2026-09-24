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
