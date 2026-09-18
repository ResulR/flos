import {
  findPublicProducts,
  type PublicProductRow,
} from './products.repository.js'
import type { PublicProductFilters } from './products.schemas.js'

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

export async function listPublicProducts(
  filters: PublicProductFilters,
): Promise<PublicProductListItem[]> {
  const products = await findPublicProducts(filters)

  return products.map(toPublicProductListItem)
}
