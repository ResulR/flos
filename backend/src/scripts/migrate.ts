import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { db } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const migrationsDir = resolve(__dirname, '../../migrations')

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function getMigrationFiles() {
  const files = await readdir(migrationsDir)

  return files.filter((file) => file.endsWith('.sql')).sort()
}

async function getAppliedMigrations() {
  const result = await db.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM _migrations ORDER BY filename',
  )

  return new Map(result.rows.map((row) => [row.filename, row.checksum]))
}

async function applyMigration(filename: string) {
  const client = await db.connect()
  const sql = await readFile(resolve(migrationsDir, filename), 'utf8')
  const checksum = createHash('sha256').update(sql).digest('hex')

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      'INSERT INTO _migrations (filename, checksum) VALUES ($1, $2)',
      [filename, checksum],
    )
    await client.query('COMMIT')

    console.log(`Applied migration: ${filename}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function migrate() {
  await ensureMigrationsTable()

  const files = await getMigrationFiles()
  const applied = await getAppliedMigrations()

  for (const filename of files) {
    const appliedChecksum = applied.get(filename)

    if (appliedChecksum) {
      const sql = await readFile(resolve(migrationsDir, filename), 'utf8')
      const currentChecksum = createHash('sha256').update(sql).digest('hex')

      if (currentChecksum != appliedChecksum) {
        throw new Error(`Applied migration was modified: ${filename}`)
      }

      continue
    }

    await applyMigration(filename)
  }

  console.log('Migrations complete')
}

migrate()
  .catch((error) => {
    console.error('Migration failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.end()
  })
