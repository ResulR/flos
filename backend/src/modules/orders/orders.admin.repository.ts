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
