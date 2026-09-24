import { db } from '../../config/database.js'

export type AdminOrderStatus =
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

export type AdminOrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export type AdminOrderListRow = {
  id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  fulfillment_method: 'delivery' | 'pickup'
  status: AdminOrderStatus
  payment_status: AdminOrderPaymentStatus
  total_cents: string
  currency: 'EUR'
  created_at: Date
}

export async function findAdminOrders(): Promise<AdminOrderListRow[]> {
  const result = await db.query<AdminOrderListRow>(
    `
      SELECT
        id::text AS id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        fulfillment_method,
        status,
        payment_status,
        total_cents::text AS total_cents,
        currency,
        created_at
      FROM orders
      ORDER BY created_at DESC, id DESC
    `,
  )

  return result.rows
}

export type AdminOrderDetailRow = {
  id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  fulfillment_method: 'delivery' | 'pickup'
  delivery_address_line1: string | null
  delivery_address_line2: string | null
  delivery_postal_code: string | null
  delivery_city: string | null
  delivery_country: string | null
  status: AdminOrderStatus
  payment_status: AdminOrderPaymentStatus
  subtotal_cents: string
  delivery_fee_cents: string
  total_cents: string
  currency: 'EUR'
  reservation_id: string | null
  created_at: Date
  updated_at: Date
}

export async function findAdminOrderById(
  orderId: string,
): Promise<AdminOrderDetailRow | null> {
  const result = await db.query<AdminOrderDetailRow>(
    `
      SELECT
        id::text AS id,
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
        subtotal_cents::text AS subtotal_cents,
        delivery_fee_cents::text AS delivery_fee_cents,
        total_cents::text AS total_cents,
        currency,
        reservation_id::text AS reservation_id,
        created_at,
        updated_at
      FROM orders
      WHERE id = $1::bigint
      LIMIT 1
    `,
    [orderId],
  )

  return result.rows[0] ?? null
}

export type AdminOrderItemRow = {
  product_id: string
  product_name: string
  unit_price_cents: string
}

export async function findAdminOrderItems(
  orderId: string,
): Promise<AdminOrderItemRow[]> {
  const result = await db.query<AdminOrderItemRow>(
    `
      SELECT
        product_id::text AS product_id,
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
