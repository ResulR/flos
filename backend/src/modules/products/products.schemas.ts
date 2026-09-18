import { z } from 'zod'

const bigintIdSchema = z.string().regex(/^[1-9]\d*$/, 'Identifiant invalide')

const nonNegativeIntegerStringSchema = z
  .string()
  .regex(/^\d+$/, 'Entier positif ou nul attendu')

export const publicProductFiltersSchema = z
  .object({
    brandId: bigintIdSchema.optional(),
    bikeTypeId: bigintIdSchema.optional(),
    conditionId: bigintIdSchema.optional(),
    year: z.coerce.number().int().min(0).optional(),
    minPriceCents: nonNegativeIntegerStringSchema.optional(),
    maxPriceCents: nonNegativeIntegerStringSchema.optional(),
    availability: z.enum(['available', 'reserved', 'sold']).optional(),
    sort: z.enum(['recent', 'price_asc', 'price_desc']).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .refine(
    ({ minPriceCents, maxPriceCents }) =>
      minPriceCents === undefined ||
      maxPriceCents === undefined ||
      BigInt(minPriceCents) <= BigInt(maxPriceCents),
    {
      message: 'Le prix minimum doit être inférieur ou égal au prix maximum',
      path: ['minPriceCents'],
    },
  )

export type PublicProductFilters = z.infer<typeof publicProductFiltersSchema>

export const publicProductParamsSchema = z.object({
  productId: bigintIdSchema,
})

export const publicProductMediaParamsSchema = z.object({
  productId: bigintIdSchema,
  mediaId: bigintIdSchema,
})

export type PublicProductParams = z.infer<typeof publicProductParamsSchema>

export type PublicProductMediaParams = z.infer<
  typeof publicProductMediaParamsSchema
>
