import type { PoolClient } from 'pg'

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
