import { db } from '../../config/database.js'

export type PublicProductRow = {
  id: string
  brand: string
  model: string
  price_cents: string
  condition: string
  status: 'available' | 'reserved' | 'sold'
}

export async function findPublicProducts(): Promise<PublicProductRow[]> {
  const result = await db.query<PublicProductRow>(`
    SELECT
      p.id::text AS id,
      brand.name AS brand,
      p.model,
      p.price_cents::text AS price_cents,
      condition.name AS condition,
      p.status
    FROM products AS p
    INNER JOIN product_brands AS brand
      ON brand.id = p.brand_id
    INNER JOIN bike_conditions AS condition
      ON condition.id = p.condition_id
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND p.status IN ('available', 'reserved', 'sold')
    ORDER BY p.created_at DESC, p.id DESC
  `)

  return result.rows
}
