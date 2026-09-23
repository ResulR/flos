import { createHash, randomBytes } from 'node:crypto'

import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import { revalidateCart } from '../cart/cart.service.js'
import type { RevalidateCartBody } from '../cart/cart.schemas.js'
import {
  lockReservationForPurchase,
  lockReservedProductForOrder,
  markReservationConverted,
} from '../reservations/reservations.repository.js'
import { getDeliveryFeeCents } from '../site-settings/site-settings.service.js'
import type {
  DraftOrderCheckoutData,
  ReservationOrderCheckoutData,
} from './orders.schemas.js'
import {
  findPublicOrderByTrackingTokenHash,
  findPublicOrderItems,
  insertDraftOrder,
  insertDraftOrderItems,
} from './orders.repository.js'

export type CreateDraftOrderInput = {
  cart: RevalidateCartBody
  checkout: DraftOrderCheckoutData
}

export type CreatedDraftOrder = {
  id: string
  trackingToken: string
  status: 'pending_payment'
  paymentStatus: 'pending'
  subtotalCents: string
  deliveryFeeCents: string
  totalCents: string
  currency: 'EUR'
  items: Array<{
    productId: string
    productName: string
    unitPriceCents: string
  }>
}

function createTrackingToken() {
  return randomBytes(32).toString('base64url')
}

function hashTrackingToken(trackingToken: string) {
  return createHash('sha256').update(trackingToken).digest('hex')
}

export async function createDraftOrder(
  input: CreateDraftOrderInput,
): Promise<CreatedDraftOrder> {
  const cart = await revalidateCart(input.cart)

  if (!cart.isValid) {
    throw new AppError(
      409,
      'PRODUCT_NOT_AVAILABLE',
      'Un ou plusieurs produits ne sont plus disponibles',
    )
  }

  const items = cart.items.map((item) => {
    if (
      !item.available ||
      item.brand === null ||
      item.model === null ||
      item.priceCents === null
    ) {
      throw new AppError(
        409,
        'PRODUCT_NOT_AVAILABLE',
        'Un ou plusieurs produits ne sont plus disponibles',
      )
    }

    return {
      productId: item.productId,
      productName: `${item.brand} ${item.model}`,
      unitPriceCents: item.priceCents,
    }
  })

  const subtotalCents = BigInt(cart.totalCents)
  const deliveryFeeCents =
    input.checkout.fulfillmentMethod === 'pickup'
      ? 0n
      : BigInt(await getDeliveryFeeCents())
  const totalCents = subtotalCents + deliveryFeeCents
  const trackingToken = createTrackingToken()

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const order = await insertDraftOrder(client, {
      ...input.checkout,
      subtotalCents: subtotalCents.toString(),
      deliveryFeeCents: deliveryFeeCents.toString(),
      totalCents: totalCents.toString(),
      publicTrackingTokenHash: hashTrackingToken(trackingToken),
      reservationId: null,
    })

    await insertDraftOrderItems(client, order.id, items)

    await client.query('COMMIT')

    return {
      id: order.id,
      trackingToken,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      totalCents: order.total_cents,
      currency: order.currency,
      items,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type CreateReservationOrderInput = {
  reservationId: string
  purchaseToken: string
  checkout: ReservationOrderCheckoutData
}

function hashReservationPurchaseToken(purchaseToken: string) {
  return createHash('sha256').update(purchaseToken).digest('hex')
}

export async function createOrderFromReservation(
  input: CreateReservationOrderInput,
): Promise<CreatedDraftOrder> {
  const deliveryFeeCents =
    input.checkout.fulfillmentMethod === 'pickup'
      ? 0n
      : BigInt(await getDeliveryFeeCents())

  const trackingToken = createTrackingToken()
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const reservation = await lockReservationForPurchase(
      client,
      input.reservationId,
      hashReservationPurchaseToken(input.purchaseToken),
    )

    if (!reservation) {
      throw new AppError(
        403,
        'RESERVATION_ACCESS_DENIED',
        'Accès à la réservation refusé',
      )
    }

    if (reservation.status === 'expired' || reservation.is_expired) {
      throw new AppError(410, 'RESERVATION_EXPIRED', 'La réservation a expiré')
    }

    if (reservation.status !== 'active') {
      throw new AppError(
        403,
        'RESERVATION_ACCESS_DENIED',
        'Accès à la réservation refusé',
      )
    }

    const product = await lockReservedProductForOrder(
      client,
      reservation.product_id,
    )

    if (
      !product ||
      !product.is_active ||
      product.deleted_at !== null ||
      product.status !== 'reserved'
    ) {
      throw new AppError(409, 'PRODUCT_NOT_AVAILABLE', 'Produit indisponible')
    }

    const subtotalCents = BigInt(product.price_cents)
    const totalCents = subtotalCents + deliveryFeeCents

    const item = {
      productId: product.id,
      productName: `${product.brand} ${product.model}`,
      unitPriceCents: product.price_cents,
    }

    const order = await insertDraftOrder(client, {
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      customerEmail: reservation.customer_email,
      customerPhone: reservation.customer_phone,
      ...input.checkout,
      subtotalCents: subtotalCents.toString(),
      deliveryFeeCents: deliveryFeeCents.toString(),
      totalCents: totalCents.toString(),
      publicTrackingTokenHash: hashTrackingToken(trackingToken),
      reservationId: reservation.id,
    })

    await insertDraftOrderItems(client, order.id, [item])
    await markReservationConverted(client, reservation.id)

    await client.query('COMMIT')

    return {
      id: order.id,
      trackingToken,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotalCents: order.subtotal_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      totalCents: order.total_cents,
      currency: order.currency,
      items: [item],
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type PublicOrderTracking = {
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
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired'
  fulfillmentMethod: 'delivery' | 'pickup'
  totalCents: string
  currency: 'EUR'
  items: Array<{
    productName: string
    unitPriceCents: string
  }>
}

export async function getPublicOrderTracking(
  trackingToken: string,
): Promise<PublicOrderTracking> {
  const order = await findPublicOrderByTrackingTokenHash(
    hashTrackingToken(trackingToken),
  )

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Commande introuvable')
  }

  const items = await findPublicOrderItems(order.id)

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.payment_status,
    fulfillmentMethod: order.fulfillment_method,
    totalCents: order.total_cents,
    currency: order.currency,
    items: items.map((item) => ({
      productName: item.product_name,
      unitPriceCents: item.unit_price_cents,
    })),
  }
}
