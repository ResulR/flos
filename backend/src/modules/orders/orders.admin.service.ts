import {
  findAdminOrders,
  type AdminOrderPaymentStatus,
  type AdminOrderStatus,
} from './orders.admin.repository.js'

export type AdminOrderListItem = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  fulfillmentMethod: 'delivery' | 'pickup'
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  totalCents: string
  currency: 'EUR'
  createdAt: string
}

export async function listAdminOrders(): Promise<AdminOrderListItem[]> {
  const orders = await findAdminOrders()

  return orders.map((order) => ({
    id: order.id,
    customerFirstName: order.customer_first_name,
    customerLastName: order.customer_last_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    fulfillmentMethod: order.fulfillment_method,
    status: order.status,
    paymentStatus: order.payment_status,
    totalCents: order.total_cents,
    currency: order.currency,
    createdAt: order.created_at.toISOString(),
  }))
}
