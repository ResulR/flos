import { z } from 'zod'

import { revalidateCartBodySchema } from '../cart/cart.schemas.js'

const customerFields = {
  customerFirstName: z.string().trim().min(1, 'Prénom requis'),
  customerLastName: z.string().trim().min(1, 'Nom requis'),
  customerEmail: z.string().trim().email('Email invalide'),
  customerPhone: z.string().trim().min(1, 'Téléphone requis'),
}

const pickupCheckoutSchema = z
  .object({
    ...customerFields,
    fulfillmentMethod: z.literal('pickup'),
    deliveryAddressLine1: z.null().optional(),
    deliveryAddressLine2: z.null().optional(),
    deliveryPostalCode: z.null().optional(),
    deliveryCity: z.null().optional(),
    deliveryCountry: z.null().optional(),
  })
  .strict()
  .transform((input) => ({
    ...input,
    deliveryAddressLine1: null,
    deliveryAddressLine2: null,
    deliveryPostalCode: null,
    deliveryCity: null,
    deliveryCountry: null,
  }))

const deliveryCheckoutSchema = z
  .object({
    ...customerFields,
    fulfillmentMethod: z.literal('delivery'),
    deliveryAddressLine1: z.string().trim().min(1, 'Adresse requise'),
    deliveryAddressLine2: z
      .string()
      .trim()
      .min(1, 'Complément d’adresse invalide')
      .nullable()
      .optional(),
    deliveryPostalCode: z.string().trim().min(1, 'Code postal requis'),
    deliveryCity: z.string().trim().min(1, 'Ville requise'),
    deliveryCountry: z.string().trim().min(1, 'Pays requis'),
  })
  .strict()
  .transform((input) => ({
    ...input,
    deliveryAddressLine2: input.deliveryAddressLine2 ?? null,
  }))

export const draftOrderCheckoutSchema = z.union([
  pickupCheckoutSchema,
  deliveryCheckoutSchema,
])

export type DraftOrderCheckoutData = z.infer<typeof draftOrderCheckoutSchema>

export const createDraftOrderBodySchema = z
  .object({
    cart: revalidateCartBodySchema,
    checkout: draftOrderCheckoutSchema,
  })
  .strict()

export type CreateDraftOrderBody = z.infer<typeof createDraftOrderBodySchema>

export const publicOrderTrackingParamsSchema = z
  .object({
    trackingToken: z
      .string()
      .regex(/^[A-Za-z0-9_-]{43}$/, 'Token de suivi invalide'),
  })
  .strict()

export type PublicOrderTrackingParams = z.infer<
  typeof publicOrderTrackingParamsSchema
>
