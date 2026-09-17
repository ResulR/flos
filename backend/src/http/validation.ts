import type { RequestHandler } from 'express'
import type { ZodIssue, ZodType } from 'zod'

import { AppError } from './errors.js'

type ValidationSchemas = {
  body?: ZodType
  params?: ZodType
  query?: ZodType
}

export type ValidatedRequest = {
  body?: unknown
  params?: unknown
  query?: unknown
}

export type ValidationLocals = {
  validated: ValidatedRequest
}

function formatIssues(scope: 'body' | 'params' | 'query', issues: ZodIssue[]) {
  const fields: Record<string, string> = {}

  for (const issue of issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root'
    const key = `${scope}.${path}`

    if (!(key in fields)) {
      fields[key] = issue.message
    }
  }

  return fields
}

export function validateRequest(
  schemas: ValidationSchemas,
): RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  unknown,
  ValidationLocals
> {
  return (req, res, next) => {
    const validated: ValidatedRequest = {}
    const fields: Record<string, string> = {}

    const inputs = [
      ['body', schemas.body, req.body],
      ['params', schemas.params, req.params],
      ['query', schemas.query, req.query],
    ] as const

    for (const [scope, schema, value] of inputs) {
      if (!schema) {
        continue
      }

      const result = schema.safeParse(value)

      if (!result.success) {
        Object.assign(fields, formatIssues(scope, result.error.issues))
        continue
      }

      validated[scope] = result.data
    }

    if (Object.keys(fields).length > 0) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Requête invalide', fields))

      return
    }

    res.locals.validated = validated
    next()
  }
}
