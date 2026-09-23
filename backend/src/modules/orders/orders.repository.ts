import type { PoolClient } from 'pg'

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
        public_tracking_token_hash
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
        $14
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
