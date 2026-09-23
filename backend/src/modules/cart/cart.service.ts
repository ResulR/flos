import { findCartProducts, type CartProductRow } from './cart.repository.js'
import type { RevalidateCartBody } from './cart.schemas.js'

export type RevalidatedCartItem = {
  productId: string
  quantity: 1
  available: boolean
  brand: string | null
  model: string | null
  priceCents: string | null
}

export type RevalidatedCart = {
  items: RevalidatedCartItem[]
  totalCents: string
  isValid: boolean
}

function isPubliclyVisible(product: CartProductRow) {
  return (
    product.is_active &&
    product.deleted_at === null &&
    product.status !== 'hidden'
  )
}

function isAvailableForCart(product: CartProductRow) {
  return (
    isPubliclyVisible(product) &&
    product.status === 'available' &&
    !product.has_active_reservation
  )
}

export async function revalidateCart(
  input: RevalidateCartBody,
): Promise<RevalidatedCart> {
  const products = await findCartProducts(
    input.items.map((item) => item.productId),
  )

  const productsById = new Map(products.map((product) => [product.id, product]))

  let totalCents = 0n

  const items = input.items.map((item): RevalidatedCartItem => {
    const product = productsById.get(item.productId)

    if (!product || !isPubliclyVisible(product)) {
      return {
        productId: item.productId,
        quantity: 1,
        available: false,
        brand: null,
        model: null,
        priceCents: null,
      }
    }

    const available = isAvailableForCart(product)

    if (available) {
      totalCents += BigInt(product.price_cents)
    }

    return {
      productId: item.productId,
      quantity: 1,
      available,
      brand: product.brand,
      model: product.model,
      priceCents: product.price_cents,
    }
  })

  return {
    items,
    totalCents: totalCents.toString(),
    isValid: items.every((item) => item.available),
  }
}
