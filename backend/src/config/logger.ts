import pino from 'pino'

import { env } from './env.js'

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',

  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'accessToken',
      'refreshToken',
      'sessionToken',
      'authorization',
      '*.password',
      '*.password_hash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.sessionToken',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
})
