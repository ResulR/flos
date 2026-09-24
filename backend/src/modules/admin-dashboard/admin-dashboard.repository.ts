import { db } from '../../config/database.js'
import type {
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from '../orders/orders.admin.repository.js'

export type AdminDashboardSummaryRow = {
  current_month_sales_count: number
  current_month_revenue_cents: string
  all_time_sales_count: number
  all_time_revenue_cents: string
  available_products_count: number
  active_reservations_count: number
  pending_trade_ins_count: number
}

export async function findAdminDashboardSummary(): Promise<AdminDashboardSummaryRow> {
  const result = await db.query<AdminDashboardSummaryRow>(
    `
      SELECT
        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
            AND created_at >= date_trunc('month', now())
            AND created_at < date_trunc('month', now()) + interval '1 month'
        )::int AS current_month_sales_count,

        COALESCE(
          SUM(total_cents) FILTER (
            WHERE payment_status = 'paid'
              AND created_at >= date_trunc('month', now())
              AND created_at < date_trunc('month', now()) + interval '1 month'
          ),
          0
        )::text AS current_month_revenue_cents,

        COUNT(*) FILTER (
          WHERE payment_status = 'paid'
        )::int AS all_time_sales_count,

        COALESCE(
          SUM(total_cents) FILTER (
            WHERE payment_status = 'paid'
          ),
          0
        )::text AS all_time_revenue_cents,

        (
          SELECT COUNT(*)::int
          FROM products
          WHERE status = 'available'
            AND is_active = true
            AND deleted_at IS NULL
        ) AS available_products_count,

        (
          SELECT COUNT(*)::int
          FROM reservations
          WHERE status = 'active'
            AND expires_at > now()
        ) AS active_reservations_count,

        (
          SELECT COUNT(*)::int
          FROM trade_ins
          WHERE status = 'pending'
        ) AS pending_trade_ins_count
      FROM orders
    `,
  )

  const summary = result.rows[0]

  if (!summary) {
    throw new Error('Admin dashboard summary query returned no row')
  }

  return summary
}

export type AdminDashboardRecentOrderRow = {
  id: string
  customer_first_name: string
  customer_last_name: string
  status: AdminOrderStatus
  payment_status: AdminOrderPaymentStatus
  total_cents: string
  currency: 'EUR'
  created_at: Date
}

export async function findAdminDashboardRecentOrders(): Promise<
  AdminDashboardRecentOrderRow[]
> {
  const result = await db.query<AdminDashboardRecentOrderRow>(
    `
      SELECT
        id::text AS id,
        customer_first_name,
        customer_last_name,
        status,
        payment_status,
        total_cents::text AS total_cents,
        currency,
        created_at
      FROM orders
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `,
  )

  return result.rows
}
