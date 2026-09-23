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

export type CreateTradeInInput = z.infer<typeof createTradeInSchema>
