import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import test from 'node:test'

import express from 'express'

import { errorHandler } from '../http/error-handler.js'
import { requireAdminSameOrigin } from '../modules/admin-auth/admin-csrf.middleware.js'

test('admin mutating requests require the public same origin', async () => {
  const app = express()

  app.set('trust proxy', 'loopback')

  app.use('/admin', requireAdminSameOrigin)

  app.get('/admin/resource', (_req, res) => {
    res.status(200).json({ data: { ok: true } })
  })

  app.post('/admin/resource', (_req, res) => {
    res.status(200).json({ data: { ok: true } })
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
    const url = `http://127.0.0.1:${port}/admin/resource`

    const proxyHeaders = {
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-Host': 'admin.example.test',
    }

    const safeResponse = await fetch(url, {
      headers: proxyHeaders,
    })

    assert.equal(safeResponse.status, 200)

    const missingOriginResponse = await fetch(url, {
      method: 'POST',
      headers: proxyHeaders,
    })

    assert.equal(missingOriginResponse.status, 403)

    const forgedOriginResponse = await fetch(url, {
      method: 'POST',
      headers: {
        ...proxyHeaders,
        Origin: 'https://evil.example',
      },
    })

    assert.equal(forgedOriginResponse.status, 403)

    const validOriginResponse = await fetch(url, {
      method: 'POST',
      headers: {
        ...proxyHeaders,
        Origin: 'https://admin.example.test',
      },
    })

    assert.equal(validOriginResponse.status, 200)

    const validRefererResponse = await fetch(url, {
      method: 'POST',
      headers: {
        ...proxyHeaders,
        Referer: 'https://admin.example.test/admin/products',
      },
    })

    assert.equal(validRefererResponse.status, 200)
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
