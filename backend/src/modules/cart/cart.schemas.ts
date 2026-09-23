import { z } from 'zod'

const bigintIdSchema = z.string().regex(/^[1-9]\d*$/, 'Identifiant invalide')

const cartItemSchema = z
  .object({
    productId: bigintIdSchema,
    quantity: z.literal(1),
  })
  .strict()

export const revalidateCartBodySchema = z
  .object({
    items: z.array(cartItemSchema).min(1, 'Le panier ne peut pas être vide'),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const seen = new Set<string>()

    items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'productId'],
          message: 'Produit dupliqué dans le panier',
        })

        return
      }

      seen.add(item.productId)
    })
  })

export type RevalidateCartBody = z.infer<typeof revalidateCartBodySchema>
