import { randomUUID } from 'node:crypto'

import { pinoHttp } from 'pino-http'

import { logger } from '../config/logger.js'

export const requestLogger = pinoHttp({
  logger,

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        path: req.url?.split('?')[0],
      }
    },
  },

  genReqId: (_req, res) => {
    const requestId = randomUUID()

    res.setHeader('X-Request-Id', requestId)

    return requestId
  },
})
