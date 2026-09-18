import {
  findPublicProducts,
  type PublicProductRow,
} from './products.repository.js'

export type PublicProductListItem = {
  id: string
  brand: string
  model: string
  priceCents: string
  condition: string
  status: 'available' | 'reserved' | 'sold'
  imageUrl: string | null
}

function toPublicProductListItem(row: PublicProductRow): PublicProductListItem {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    priceCents: row.price_cents,
    condition: row.condition,
    status: row.status,
    imageUrl: null,
  }
}

export async function listPublicProducts(): Promise<PublicProductListItem[]> {
  const products = await findPublicProducts()

  return products.map(toPublicProductListItem)
}
