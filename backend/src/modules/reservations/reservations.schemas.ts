import { z } from 'zod'

const bigintIdSchema = z.string().regex(/^[1-9]\d*$/, 'Identifiant invalide')

export const createReservationSchema = z
  .object({
    productId: bigintIdSchema,
    firstName: z.string().trim().min(1, 'Prénom requis'),
    lastName: z.string().trim().min(1, 'Nom requis'),
    email: z.string().trim().email('Email invalide'),
    phone: z.string().trim().min(1, 'Téléphone requis'),
    durationDays: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .strict()

export type CreateReservationInput = z.infer<typeof createReservationSchema>
