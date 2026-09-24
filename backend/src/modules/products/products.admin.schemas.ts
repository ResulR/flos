import { z } from 'zod'

const bigintIdSchema = z.string().regex(/^[1-9]\d*$/, 'Identifiant invalide')

const productReferenceTypeSchema = z.enum(['brand', 'bikeType', 'condition'])

export const createProductReferenceBodySchema = z
  .object({
    type: productReferenceTypeSchema,
    name: z.string().trim().min(1, 'Nom requis'),
  })
  .strict()

const productSpecSchema = z
  .object({
    label: z.string().trim().min(1, 'Libellé requis'),
    value: z.string().trim().min(1, 'Valeur requise'),
  })
  .strict()

export const createAdminProductBodySchema = z
  .object({
    brandId: bigintIdSchema,
    bikeTypeId: bigintIdSchema,
    conditionId: bigintIdSchema,
    model: z.string().trim().min(1, 'Modèle requis'),
    year: z.number().int().min(0).nullable(),
    description: z.string().trim().min(1, 'Description requise'),
    priceCents: z
      .number()
      .int()
      .min(0, 'Le prix doit être positif ou nul')
      .max(Number.MAX_SAFE_INTEGER),
    status: z.enum(['available', 'hidden']),
    isActive: z.boolean(),
    specs: z.array(productSpecSchema).superRefine((specs, context) => {
      const labels = new Set<string>()

      for (const [index, spec] of specs.entries()) {
        if (labels.has(spec.label)) {
          context.addIssue({
            code: 'custom',
            message: 'Libellé de caractéristique dupliqué',
            path: [index, 'label'],
          })
        }

        labels.add(spec.label)
      }
    }),
  })
  .strict()

export type ProductReferenceType = z.infer<typeof productReferenceTypeSchema>

export type CreateProductReferenceBody = z.infer<
  typeof createProductReferenceBodySchema
>

export type CreateAdminProductBody = z.infer<
  typeof createAdminProductBodySchema
>
