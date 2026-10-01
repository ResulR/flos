import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADMIN_PASSWORD_HASH_PREFIX,
  hashAdminPassword,
  verifyAdminPassword,
} from '../modules/admin-auth/admin-auth.password.js'

test('hashAdminPassword creates a verifiable non-reversible password hash', async () => {
  const password = 'FloPasswordTest2026!'
  const hash = await hashAdminPassword(password)

  assert.notEqual(hash, password)
  assert.ok(hash.startsWith(`${ADMIN_PASSWORD_HASH_PREFIX}$`))
  assert.equal(await verifyAdminPassword(password, hash), true)
  assert.equal(await verifyAdminPassword('WrongPassword2026!', hash), false)
})

test('hashAdminPassword generates a unique salted hash each time', async () => {
  const password = 'FloPasswordTest2026!'

  const firstHash = await hashAdminPassword(password)
  const secondHash = await hashAdminPassword(password)

  assert.notEqual(firstHash, secondHash)
  assert.equal(await verifyAdminPassword(password, firstHash), true)
  assert.equal(await verifyAdminPassword(password, secondHash), true)
})
