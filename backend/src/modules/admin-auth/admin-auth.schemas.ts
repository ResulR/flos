import { z } from 'zod'

export const adminLoginSchema = z
  .object({
    email: z.string().trim().email('Email invalide').max(254),
    password: z.string().min(1, 'Mot de passe requis').max(200),
  })
  .strict()

export type AdminLoginInput = z.infer<typeof adminLoginSchema>
