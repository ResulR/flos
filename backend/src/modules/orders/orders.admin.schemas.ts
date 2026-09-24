import { z } from 'zod'

export const adminOrderParamsSchema = z
  .object({
    orderId: z.string().regex(/^[1-9]\d*$/, 'Identifiant invalide'),
  })
  .strict()

export type AdminOrderParams = z.infer<typeof adminOrderParamsSchema>
