import { z } from 'zod'

export const updateAdminSiteSettingsBodySchema = z
  .object({
    phone: z.string().trim().min(1, 'Téléphone invalide').nullable(),
    email: z.string().trim().email('Email invalide').nullable(),
    address: z.string().trim().min(1, 'Adresse invalide').nullable(),
    deliveryFeeCents: z
      .number()
      .int('Frais de livraison invalides')
      .nonnegative('Frais de livraison invalides'),
  })
  .strict()

export type UpdateAdminSiteSettingsBody = z.infer<
  typeof updateAdminSiteSettingsBodySchema
>
