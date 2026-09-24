import {
  findAdminDashboardRecentOrders,
  findAdminDashboardSummary,
} from './admin-dashboard.repository.js'

export type AdminDashboardData = {
  sales: {
    currentMonth: {
      count: number
      revenueCents: string
    }
    allTime: {
      count: number
      revenueCents: string
    }
  }
  availableProductsCount: number
  activeReservationsCount: number
  pendingTradeInsCount: number
  recentOrders: Array<{
    id: string
    customerFirstName: string
    customerLastName: string
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
    paymentStatus: 'pending' | 'paid' | 'failed' | 'expired'
    totalCents: string
    currency: 'EUR'
    createdAt: string
  }>
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [summary, recentOrders] = await Promise.all([
    findAdminDashboardSummary(),
    findAdminDashboardRecentOrders(),
  ])

  return {
    sales: {
      currentMonth: {
        count: summary.current_month_sales_count,
        revenueCents: summary.current_month_revenue_cents,
      },
      allTime: {
        count: summary.all_time_sales_count,
        revenueCents: summary.all_time_revenue_cents,
      },
    },
    availableProductsCount: summary.available_products_count,
    activeReservationsCount: summary.active_reservations_count,
    pendingTradeInsCount: summary.pending_trade_ins_count,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      customerFirstName: order.customer_first_name,
      customerLastName: order.customer_last_name,
      status: order.status,
      paymentStatus: order.payment_status,
      totalCents: order.total_cents,
      currency: order.currency,
      createdAt: order.created_at.toISOString(),
    })),
  }
}
