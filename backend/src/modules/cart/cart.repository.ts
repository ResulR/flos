import { db } from '../../config/database.js'

export type CartProductRow = {
  id: string
  brand: string
  model: string
  price_cents: string
  status: 'available' | 'reserved' | 'sold' | 'hidden'
  is_active: boolean
  deleted_at: Date | null
  has_active_reservation: boolean
}

export async function findCartProducts(
  productIds: string[],
): Promise<CartProductRow[]> {
  const result = await db.query<CartProductRow>(
    `
      SELECT
        p.id::text AS id,
        brand.name AS brand,
        p.model,
        p.price_cents::text AS price_cents,
        p.status,
        p.is_active,
        p.deleted_at,
        EXISTS (
          SELECT 1
          FROM reservations AS reservation
          WHERE reservation.product_id = p.id
            AND reservation.status = 'active'
            AND reservation.expires_at > now()
        ) AS has_active_reservation
      FROM products AS p
      INNER JOIN product_brands AS brand
        ON brand.id = p.brand_id
      WHERE p.id = ANY($1::bigint[])
    `,
    [productIds],
  )

  return result.rows
}
