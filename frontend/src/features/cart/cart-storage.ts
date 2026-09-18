export const CART_STORAGE_KEY = 'flos-bikes:cart'
const CART_STORAGE_VERSION = 1

export type CartItem = {
  productId: string
  quantity: 1
}

type StoredCart = {
  version: number
  items: unknown
}

function isValidProductId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value)
}

export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const items: CartItem[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const productId = Reflect.get(item, 'productId')
    const quantity = Reflect.get(item, 'quantity')

    if (!isValidProductId(productId) || quantity !== 1 || seen.has(productId)) {
      continue
    }

    seen.add(productId)

    items.push({
      productId,
      quantity: 1,
    })
  }

  return items
}

export function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as StoredCart

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== CART_STORAGE_VERSION
    ) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }

    const items = sanitizeCartItems(parsed.items)

    writeStoredCart(items)

    return items
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY)
    return []
  }
}

export function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  const sanitizedItems = sanitizeCartItems(items)

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: CART_STORAGE_VERSION,
      items: sanitizedItems,
    }),
  )
}
