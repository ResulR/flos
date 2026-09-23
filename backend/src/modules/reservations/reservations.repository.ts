import type { PoolClient } from 'pg'

import { db } from '../../config/database.js'

export type ReservableProductRow = {
  id: string
  status: 'available' | 'reserved' | 'sold' | 'hidden'
  is_active: boolean
  deleted_at: Date | null
}

export async function lockProductForReservation(
  client: PoolClient,
  productId: string,
): Promise<ReservableProductRow | null> {
  const result = await client.query<ReservableProductRow>(
    `
      SELECT
        id::text AS id,
        status,
        is_active,
        deleted_at
      FROM products
      WHERE id = $1::bigint
      FOR UPDATE
    `,
    [productId],
  )

  return result.rows[0] ?? null
}

export async function hasActiveReservation(
  client: PoolClient,
  productId: string,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM reservations
        WHERE product_id = $1::bigint
          AND status = 'active'
      ) AS exists
    `,
    [productId],
  )

  return result.rows[0]?.exists ?? false
}

export async function lockReservationContact(
  client: PoolClient,
  email: string,
  phone: string,
): Promise<void> {
  const lockKeys = [
    `reservation-contact:email:${email}`,
    `reservation-contact:phone:${phone}`,
  ].sort()

  for (const lockKey of lockKeys) {
    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          hashtextextended($1, 0)
        )
      `,
      [lockKey],
    )
  }
}

export async function hasActiveReservationForContact(
  client: PoolClient,
  email: string,
  phone: string,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM reservations
        WHERE status = 'active'
          AND expires_at > now()
          AND (
            customer_email = $1
            OR customer_phone = $2
          )
      ) AS exists
    `,
    [email, phone],
  )

  return result.rows[0]?.exists ?? false
}

export type InsertReservationInput = {
  productId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  durationDays: 1 | 2 | 3
  cancelTokenHash: string
  purchaseTokenHash: string
}

export type ReservationRow = {
  id: string
  product_id: string
  expires_at: Date
  status: 'active'
}

export async function insertReservation(
  client: PoolClient,
  input: InsertReservationInput,
): Promise<ReservationRow> {
  const result = await client.query<ReservationRow>(
    `
      INSERT INTO reservations (
        product_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        expires_at,
        status,
        cancel_token_hash,
        purchase_token_hash
      )
      VALUES (
        $1::bigint,
        $2,
        $3,
        $4,
        $5,
        now() + ($6 * interval '1 day'),
        'active',
        $7,
        $8
      )
      RETURNING
        id::text AS id,
        product_id::text AS product_id,
        expires_at,
        status
    `,
    [
      input.productId,
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      input.durationDays,
      input.cancelTokenHash,
      input.purchaseTokenHash,
    ],
  )

  const reservation = result.rows[0]

  if (!reservation) {
    throw new Error('Reservation insert returned no row')
  }

  return reservation
}

export type ReservationAccessRow = {
  id: string
  product_id: string
}

export async function findReservationByPurchaseTokenHash(
  reservationId: string,
  purchaseTokenHash: string,
): Promise<ReservationAccessRow | null> {
  const result = await db.query<ReservationAccessRow>(
    `
      SELECT
        id::text AS id,
        product_id::text AS product_id
      FROM reservations
      WHERE id = $1::bigint
        AND purchase_token_hash = $2
      LIMIT 1
    `,
    [reservationId, purchaseTokenHash],
  )

  return result.rows[0] ?? null
}

export type ReservationPurchaseRow = {
  id: string
  product_id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  expires_at: Date
  status: 'active' | 'cancelled' | 'expired' | 'converted'
  is_expired: boolean
}

export async function lockReservationForPurchase(
  client: PoolClient,
  reservationId: string,
  purchaseTokenHash: string,
): Promise<ReservationPurchaseRow | null> {
  const result = await client.query<ReservationPurchaseRow>(
    `
      SELECT
        id::text AS id,
        product_id::text AS product_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        expires_at,
        status,
        expires_at <= now() AS is_expired
      FROM reservations
      WHERE id = $1::bigint
        AND purchase_token_hash = $2
      FOR UPDATE
    `,
    [reservationId, purchaseTokenHash],
  )

  return result.rows[0] ?? null
}

export type ReservedProductForOrderRow = {
  id: string
  brand: string
  model: string
  price_cents: string
  status: 'available' | 'reserved' | 'sold' | 'hidden'
  is_active: boolean
  deleted_at: Date | null
}

export async function lockReservedProductForOrder(
  client: PoolClient,
  productId: string,
): Promise<ReservedProductForOrderRow | null> {
  const result = await client.query<ReservedProductForOrderRow>(
    `
      SELECT
        product.id::text AS id,
        brand.name AS brand,
        product.model,
        product.price_cents::text AS price_cents,
        product.status,
        product.is_active,
        product.deleted_at
      FROM products AS product
      INNER JOIN product_brands AS brand
        ON brand.id = product.brand_id
      WHERE product.id = $1::bigint
      FOR UPDATE OF product
    `,
    [productId],
  )

  return result.rows[0] ?? null
}

export async function markReservationConverted(
  client: PoolClient,
  reservationId: string,
): Promise<void> {
  const result = await client.query(
    `
      UPDATE reservations
      SET
        status = 'converted',
        converted_at = now(),
        updated_at = now()
      WHERE id = $1::bigint
        AND status = 'active'
    `,
    [reservationId],
  )

  if (result.rowCount !== 1) {
    throw new Error('Reservation conversion updated no row')
  }
}

export async function markProductReserved(
  client: PoolClient,
  productId: string,
): Promise<void> {
  await client.query(
    `
      UPDATE products
      SET
        status = 'reserved',
        updated_at = now()
      WHERE id = $1::bigint
    `,
    [productId],
  )
}

export async function markDueReservationsExpired(
  client: PoolClient,
): Promise<string[]> {
  const result = await client.query<{ product_id: string }>(
    `
      UPDATE reservations
      SET
        status = 'expired',
        updated_at = now()
      WHERE status = 'active'
        AND expires_at <= now()
      RETURNING product_id::text AS product_id
    `,
  )

  return result.rows.map((row) => row.product_id)
}

export async function releaseProductsWithoutActiveReservation(
  client: PoolClient,
  productIds: string[],
): Promise<number> {
  if (productIds.length === 0) {
    return 0
  }

  const result = await client.query(
    `
      UPDATE products AS product
      SET
        status = 'available',
        updated_at = now()
      WHERE product.id = ANY($1::bigint[])
        AND product.status = 'reserved'
        AND NOT EXISTS (
          SELECT 1
          FROM reservations AS reservation
          WHERE reservation.product_id = product.id
            AND reservation.status = 'active'
        )
    `,
    [productIds],
  )

  return result.rowCount ?? 0
}
