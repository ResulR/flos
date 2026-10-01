import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import test from 'node:test'

import express from 'express'

import { errorHandler } from '../http/error-handler.js'
import { createIpRateLimit } from '../http/ip-rate-limit.js'

test('public sensitive rate limit rejects excessive requests without blocking another IP', async () => {
  const app = express()

  app.set('trust proxy', 'loopback')

  const rateLimit = createIpRateLimit({
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
    message: 'Trop de requêtes. Réessayez plus tard.',
  })

  app.post('/sensitive', rateLimit, (_req, res) => {
    res.status(201).json({
      data: {
        created: true,
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
    const url = `http://127.0.0.1:${port}/sensitive`

    for (let request = 1; request <= 3; request += 1) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Forwarded-For': '198.51.100.20',
        },
      })

      assert.equal(response.status, 201)
    }

    const blockedResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Forwarded-For': '198.51.100.20',
      },
    })

    assert.equal(blockedResponse.status, 429)
    assert.ok(Number(blockedResponse.headers.get('retry-after')) > 0)

    const body = (await blockedResponse.json()) as {
      error: {
        code: string
      }
    }

    assert.equal(body.error.code, 'RATE_LIMITED')

    const otherIpResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Forwarded-For': '198.51.100.21',
      },
    })

    assert.equal(otherIpResponse.status, 201)
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
