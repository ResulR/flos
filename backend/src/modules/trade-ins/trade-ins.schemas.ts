import { z } from 'zod'

export const createTradeInSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Prénom requis'),
    lastName: z.string().trim().min(1, 'Nom requis'),
    email: z.string().trim().email('Email invalide'),
    phone: z.string().trim().min(1, 'Téléphone requis'),
    brand: z.string().trim().min(1, 'Marque invalide').optional(),
    model: z.string().trim().min(1, 'Modèle invalide').optional(),
    year: z.number().int('Année invalide').optional(),
    desiredPriceCents: z
      .number()
      .int('Prix souhaité invalide')
      .nonnegative('Prix souhaité invalide')
      .optional(),
    description: z.string().trim().min(1, 'Description invalide').optional(),
  })
  .strict()

export const tradeInMediaParamsSchema = z
  .object({
    tradeInId: z.string().regex(/^[1-9]\d*$/, 'Reprise invalide'),
  })
  .strict()

export const tradeInUploadTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'Token d’upload invalide')

export type CreateTradeInInput = z.infer<typeof createTradeInSchema>

export type TradeInMediaParams = z.infer<typeof tradeInMediaParamsSchema>
