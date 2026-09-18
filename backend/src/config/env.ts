import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4700),
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  PRODUCT_MEDIA_ROOT: z.string().min(1),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment configuration')
  console.error(z.prettifyError(result.error))
  process.exit(1)
}

export const env = result.data
