import { AppError } from '../../http/errors.js'

import {
  findAdminOrderById,
  findAdminOrderItems,
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

export type AdminOrderDetail = {
  id: string
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
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  subtotalCents: string
  deliveryFeeCents: string
  totalCents: string
  currency: 'EUR'
  reservationId: string | null
  items: Array<{
    productId: string
    productName: string
    unitPriceCents: string
  }>
  createdAt: string
  updatedAt: string
}

export async function getAdminOrder(
  orderId: string,
): Promise<AdminOrderDetail> {
  const order = await findAdminOrderById(orderId)

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Commande introuvable')
  }

  const items = await findAdminOrderItems(orderId)

  return {
    id: order.id,
    customerFirstName: order.customer_first_name,
    customerLastName: order.customer_last_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    fulfillmentMethod: order.fulfillment_method,
    deliveryAddressLine1: order.delivery_address_line1,
    deliveryAddressLine2: order.delivery_address_line2,
    deliveryPostalCode: order.delivery_postal_code,
    deliveryCity: order.delivery_city,
    deliveryCountry: order.delivery_country,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotalCents: order.subtotal_cents,
    deliveryFeeCents: order.delivery_fee_cents,
    totalCents: order.total_cents,
    currency: order.currency,
    reservationId: order.reservation_id,
    items: items.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      unitPriceCents: item.unit_price_cents,
    })),
    createdAt: order.created_at.toISOString(),
    updatedAt: order.updated_at.toISOString(),
  }
}
