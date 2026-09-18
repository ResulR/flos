import express from 'express'

import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from './config/database.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler } from './http/error-handler.js'
import { requestLogger } from './http/request-logger.js'
import { productsRouter } from './modules/products/products.routes.js'

const app = express()

app.use(requestLogger)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
    },
  })
})

app.use('/products', productsRouter)

app.use(errorHandler)

async function startServer() {
  try {
    await checkDatabaseConnection()
    logger.info('PostgreSQL connection established')
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to PostgreSQL')
    await closeDatabaseConnection().catch(() => undefined)
    process.exit(1)
  }

  const server = app.listen(env.PORT, '127.0.0.1', () => {
    logger.info({ port: env.PORT }, 'Flos Bikes backend listening')
  })

  let shuttingDown = false

  async function shutdown(signal: string) {
    if (shuttingDown) return
    shuttingDown = true

    logger.info({ signal }, 'Shutdown signal received')

    server.close(async (error) => {
      await closeDatabaseConnection()

      if (error) {
        logger.error({ err: error }, 'HTTP server shutdown failed')
        process.exit(1)
      }

      process.exit(0)
    })
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

void startServer()
