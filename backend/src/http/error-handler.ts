import type { ErrorRequestHandler } from 'express'

import { AppError } from './errors.js'

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  void _next

  if (
    error &&
    typeof error === 'object' &&
    Reflect.get(error, 'type') === 'entity.too.large'
  ) {
    res.status(413).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Requête trop volumineuse.',
      },
    })

    return
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    })

    return
  }

  req.log.error({ err: error }, 'Unhandled request error')

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Une erreur interne est survenue',
    },
  })
}
