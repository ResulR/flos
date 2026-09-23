import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'

import { closeDatabaseConnection, db } from '../config/database.js'
import { AppError } from '../http/errors.js'
import { createReservation } from '../modules/reservations/reservations.service.js'

type TestFixture = {
  brandId: string
  bikeTypeId: string
  conditionId: string
  productId: string
}

const fixtures: TestFixture[] = []

async function createTestFixture(): Promise<TestFixture> {
  const suffix = randomUUID()

  const result = await db.query<{
    brand_id: string
    bike_type_id: string
    condition_id: string
    product_id: string
  }>(
    `
      WITH brand AS (
        INSERT INTO product_brands (name)
        VALUES ($1)
        RETURNING id
      ),
      bike_type AS (
        INSERT INTO bike_types (name)
        VALUES ($2)
        RETURNING id
      ),
      condition AS (
        INSERT INTO bike_conditions (name)
        VALUES ($3)
        RETURNING id
      ),
      product AS (
        INSERT INTO products (
          brand_id,
          bike_type_id,
          condition_id,
          model,
          year,
          description,
          price_cents,
          status,
          is_active
        )
        SELECT
          brand.id,
          bike_type.id,
          condition.id,
          $4,
          2026,
          'Temporary product for reservation concurrency testing.',
          123400,
          'available',
          true
        FROM brand, bike_type, condition
        RETURNING id
      )
      SELECT
        brand.id::text AS brand_id,
        bike_type.id::text AS bike_type_id,
        condition.id::text AS condition_id,
        product.id::text AS product_id
      FROM brand, bike_type, condition, product
    `,
    [
      `TEST 10.10 BRAND ${suffix}`,
      `TEST 10.10 TYPE ${suffix}`,
      `TEST 10.10 CONDITION ${suffix}`,
      `TEST 10.10 PRODUCT ${suffix}`,
    ],
  )

  const row = result.rows[0]

  assert.ok(row, 'Test fixture creation returned no row')

  const fixture: TestFixture = {
    brandId: row.brand_id,
    bikeTypeId: row.bike_type_id,
    conditionId: row.condition_id,
    productId: row.product_id,
  }

  fixtures.push(fixture)

  return fixture
}

async function cleanupFixture(fixture: TestFixture) {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      'DELETE FROM reservations WHERE product_id = $1::bigint',
      [fixture.productId],
    )
    await client.query('DELETE FROM products WHERE id = $1::bigint', [
      fixture.productId,
    ])
    await client.query('DELETE FROM product_brands WHERE id = $1::bigint', [
      fixture.brandId,
    ])
    await client.query('DELETE FROM bike_types WHERE id = $1::bigint', [
      fixture.bikeTypeId,
    ])
    await client.query('DELETE FROM bike_conditions WHERE id = $1::bigint', [
      fixture.conditionId,
    ])

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

after(async () => {
  for (const fixture of fixtures) {
    await cleanupFixture(fixture)
  }

  await closeDatabaseConnection()
})

test('only one concurrent reservation succeeds for one available product', async () => {
  const fixture = await createTestFixture()

  const attempts = Array.from({ length: 8 }, (_, index) =>
    createReservation({
      productId: fixture.productId,
      firstName: `Concurrent${index + 1}`,
      lastName: 'Test',
      email: `test-10-10-${index + 1}-${randomUUID()}@example.invalid`,
      phone: `+32000010${String(index + 1).padStart(2, '0')}`,
      durationDays: 1,
    }),
  )

  const results = await Promise.allSettled(attempts)
  const fulfilled = results.filter(
    (
      result,
    ): result is PromiseFulfilledResult<
      Awaited<ReturnType<typeof createReservation>>
    > => result.status === 'fulfilled',
  )
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )

  assert.equal(fulfilled.length, 1)
  assert.equal(rejected.length, 7)

  for (const result of rejected) {
    assert.ok(result.reason instanceof AppError)
    assert.equal(result.reason.statusCode, 409)
    assert.equal(result.reason.code, 'PRODUCT_NOT_AVAILABLE')
  }

  const state = await db.query<{
    product_status: string
    active_reservations: string
  }>(
    `
      SELECT
        product.status AS product_status,
        COUNT(reservation.id)::text AS active_reservations
      FROM products AS product
      LEFT JOIN reservations AS reservation
        ON reservation.product_id = product.id
        AND reservation.status = 'active'
      WHERE product.id = $1::bigint
      GROUP BY product.id, product.status
    `,
    [fixture.productId],
  )

  const row = state.rows[0]

  assert.ok(row, 'Product state was not found after concurrent reservations')
  assert.equal(row.product_status, 'reserved')
  assert.equal(row.active_reservations, '1')
})
