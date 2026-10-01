import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import test from 'node:test'

import express from 'express'

import { errorHandler } from '../http/error-handler.js'
import {
  ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  adminLoginRateLimit,
} from '../modules/admin-auth/admin-auth.rate-limit.js'

test('admin login rate limit temporarily rejects a burst of attempts', async () => {
  const app = express()

  app.set('trust proxy', 'loopback')

  app.post('/admin/auth/login', adminLoginRateLimit, (_req, res) => {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Email ou mot de passe incorrect.',
      },
    })
  })

  app.use(errorHandler)

  const server = app.listen(0, '127.0.0.1')

  await new Promise<void>((resolve) => {
    server.once('listening', resolve)
  })

  try {
    const address = server.address()

    assert.ok(address)
    assert.notEqual(typeof address, 'string')

    const port = (address as AddressInfo).port
    const url = `http://127.0.0.1:${port}/admin/auth/login`

    for (
      let attempt = 1;
      attempt <= ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Forwarded-For': '198.51.100.10',
        },
      })

      assert.equal(response.status, 401)
    }

    const blockedResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Forwarded-For': '198.51.100.10',
      },
    })

    assert.equal(blockedResponse.status, 429)
    assert.ok(Number(blockedResponse.headers.get('retry-after')) > 0)

    const body = (await blockedResponse.json()) as {
      error: {
        code: string
        message: string
      }
    }

    assert.equal(body.error.code, 'RATE_LIMITED')
    assert.equal(
      body.error.message,
      'Trop de tentatives de connexion. Réessayez plus tard.',
    )
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }
})
