import express from 'express'

import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from './config/database.js'
import { env } from './config/env.js'

const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
    },
  })
})

async function startServer() {
  try {
    await checkDatabaseConnection()
    console.log('PostgreSQL connection established')
  } catch (error) {
    console.error('Unable to connect to PostgreSQL', error)
    await closeDatabaseConnection().catch(() => undefined)
    process.exit(1)
  }

  const server = app.listen(env.PORT, '127.0.0.1', () => {
    console.log(`Flos Bikes backend listening on http://127.0.0.1:${env.PORT}`)
  })

  let shuttingDown = false

  async function shutdown(signal: string) {
    if (shuttingDown) return
    shuttingDown = true

    console.log(`${signal} received, shutting down`)

    server.close(async (error) => {
      await closeDatabaseConnection()

      if (error) {
        console.error('HTTP server shutdown failed', error)
        process.exit(1)
      }

      process.exit(0)
    })
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

void startServer()
