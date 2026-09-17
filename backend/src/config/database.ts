import { Pool } from 'pg'

import { env } from './env.js'

export const db = new Pool({
  connectionString: env.DATABASE_URL,
})

db.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error)
})

export async function checkDatabaseConnection() {
  await db.query('SELECT 1')
}

export async function closeDatabaseConnection() {
  await db.end()
}
