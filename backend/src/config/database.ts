import { Pool } from 'pg'

import { env } from './env.js'
import { logger } from './logger.js'

export const db = new Pool({
  connectionString: env.DATABASE_URL,
})

db.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected PostgreSQL pool error')
})

export async function checkDatabaseConnection() {
  await db.query('SELECT 1')
}

export async function closeDatabaseConnection() {
  await db.end()
}
