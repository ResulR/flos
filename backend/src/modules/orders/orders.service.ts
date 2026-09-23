import { createHash, randomBytes } from 'node:crypto'

import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import { revalidateCart } from '../cart/cart.service.js'
import type { RevalidateCartBody } from '../cart/cart.schemas.js'
import { insertDraftOrder, insertDraftOrderItems } from './orders.repository.js'

export type DraftOrderCheckoutData = {
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
  deliveryFeeCents: string
}

export type CreateDraftOrderInput = {
  cart: RevalidateCartBody
  checkout: DraftOrderCheckoutData
}

export type CreatedDraftOrder = {
  id: string
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

function createInternalTrackingPlaceholder() {
  return createHash('sha256').update(randomBytes(32)).digest('hex')
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
  const deliveryFeeCents = BigInt(input.checkout.deliveryFeeCents)
  const totalCents = subtotalCents + deliveryFeeCents

  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const order = await insertDraftOrder(client, {
      ...input.checkout,
      subtotalCents: subtotalCents.toString(),
      deliveryFeeCents: deliveryFeeCents.toString(),
      totalCents: totalCents.toString(),
      publicTrackingTokenHash: createInternalTrackingPlaceholder(),
    })

    await insertDraftOrderItems(client, order.id, items)

    await client.query('COMMIT')

    return {
      id: order.id,
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
