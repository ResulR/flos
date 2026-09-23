import type { PoolClient } from 'pg'

import { db } from '../../config/database.js'

export type DraftOrderInsert = {
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  fulfillmentMethod: 'delivery' | 'pickup'
  deliveryAddressLine1: string | null
  deliveryAddressLine2: string | null
  deliveryPostalCode: string | null
  deliveryCity: string | null
  deliveryCountry: string | null
  subtotalCents: string
  deliveryFeeCents: string
  totalCents: string
  publicTrackingTokenHash: string
  reservationId: string | null
}

export type DraftOrderRow = {
  id: string
  status: 'pending_payment'
  payment_status: 'pending'
  subtotal_cents: string
  delivery_fee_cents: string
  total_cents: string
  currency: 'EUR'
}

export async function insertDraftOrder(
  client: PoolClient,
  input: DraftOrderInsert,
): Promise<DraftOrderRow> {
  const result = await client.query<DraftOrderRow>(
    `
      INSERT INTO orders (
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        fulfillment_method,
        delivery_address_line1,
        delivery_address_line2,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        status,
        payment_status,
        subtotal_cents,
        delivery_fee_cents,
        total_cents,
        currency,
        public_tracking_token_hash,
        reservation_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        'pending_payment',
        'pending',
        $11::bigint,
        $12::bigint,
        $13::bigint,
        'EUR',
        $14,
        $15::bigint
      )
      RETURNING
        id::text AS id,
        status,
        payment_status,
        subtotal_cents::text AS subtotal_cents,
        delivery_fee_cents::text AS delivery_fee_cents,
        total_cents::text AS total_cents,
        currency
    `,
    [
      input.customerFirstName,
      input.customerLastName,
      input.customerEmail,
      input.customerPhone,
      input.fulfillmentMethod,
      input.deliveryAddressLine1,
      input.deliveryAddressLine2,
      input.deliveryPostalCode,
      input.deliveryCity,
      input.deliveryCountry,
      input.subtotalCents,
      input.deliveryFeeCents,
      input.totalCents,
      input.publicTrackingTokenHash,
      input.reservationId,
    ],
  )

  const order = result.rows[0]

  if (!order) {
    throw new Error('Draft order insert returned no row')
  }

  return order
}

export type DraftOrderItemInsert = {
  productId: string
  productName: string
  unitPriceCents: string
}

export async function insertDraftOrderItems(
  client: PoolClient,
  orderId: string,
  items: DraftOrderItemInsert[],
): Promise<void> {
  for (const item of items) {
    await client.query(
      `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          unit_price_cents
        )
        VALUES (
          $1::bigint,
          $2::bigint,
          $3,
          $4::bigint
        )
      `,
      [orderId, item.productId, item.productName, item.unitPriceCents],
    )
  }
}

export type PublicOrderTrackingRow = {
  id: string
  status:
    | 'pending_payment'
    | 'payment_failed'
    | 'payment_expired'
    | 'confirmed'
    | 'preparing'
    | 'shipped'
    | 'completed'
    | 'ready'
    | 'picked_up'
    | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'expired'
  fulfillment_method: 'delivery' | 'pickup'
  total_cents: string
  currency: 'EUR'
}

export type PublicOrderTrackingItemRow = {
  product_name: string
  unit_price_cents: string
}

export async function findPublicOrderByTrackingTokenHash(
  trackingTokenHash: string,
): Promise<PublicOrderTrackingRow | null> {
  const result = await db.query<PublicOrderTrackingRow>(
    `
      SELECT
        id::text AS id,
        status,
        payment_status,
        fulfillment_method,
        total_cents::text AS total_cents,
        currency
      FROM orders
      WHERE public_tracking_token_hash = $1
      LIMIT 1
    `,
    [trackingTokenHash],
  )

  return result.rows[0] ?? null
}

export async function findPublicOrderItems(
  orderId: string,
): Promise<PublicOrderTrackingItemRow[]> {
  const result = await db.query<PublicOrderTrackingItemRow>(
    `
      SELECT
        product_name,
        unit_price_cents::text AS unit_price_cents
      FROM order_items
      WHERE order_id = $1::bigint
      ORDER BY id ASC
    `,
    [orderId],
  )

  return result.rows
}
