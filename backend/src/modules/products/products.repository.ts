import { db } from '../../config/database.js'
import type { PublicProductFilters } from './products.schemas.js'

export type PublicProductRow = {
  id: string
  brand: string
  model: string
  price_cents: string
  condition: string
  status: 'available' | 'reserved' | 'sold'
}

export async function findPublicProducts(
  filters: PublicProductFilters,
): Promise<PublicProductRow[]> {
  const conditions = [
    'p.is_active = true',
    'p.deleted_at IS NULL',
    "p.status IN ('available', 'reserved', 'sold')",
  ]

  const values: Array<string | number> = []

  function addCondition(
    sql: string,
    ...conditionValues: Array<string | number>
  ) {
    let parameterizedSql = sql

    for (const value of conditionValues) {
      values.push(value)
      parameterizedSql = parameterizedSql.replace('?', `$${values.length}`)
    }

    conditions.push(parameterizedSql)
  }

  if (filters.brandId !== undefined) {
    addCondition('p.brand_id = ?::bigint', filters.brandId)
  }

  if (filters.bikeTypeId !== undefined) {
    addCondition('p.bike_type_id = ?::bigint', filters.bikeTypeId)
  }

  if (filters.conditionId !== undefined) {
    addCondition('p.condition_id = ?::bigint', filters.conditionId)
  }

  if (filters.year !== undefined) {
    addCondition('p.year = ?', filters.year)
  }

  if (filters.minPriceCents !== undefined) {
    addCondition('p.price_cents >= ?::bigint', filters.minPriceCents)
  }

  if (filters.maxPriceCents !== undefined) {
    addCondition('p.price_cents <= ?::bigint', filters.maxPriceCents)
  }

  if (filters.availability !== undefined) {
    addCondition('p.status = ?', filters.availability)
  }

  if (filters.search !== undefined) {
    const pattern = `%${filters.search}%`

    addCondition('(brand.name ILIKE ? OR p.model ILIKE ?)', pattern, pattern)
  }

  const orderBy = {
    recent: 'p.created_at DESC, p.id DESC',
    price_asc: 'p.price_cents ASC, p.id ASC',
    price_desc: 'p.price_cents DESC, p.id DESC',
  }[filters.sort ?? 'recent']

  const result = await db.query<PublicProductRow>(
    `
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
      WHERE ${conditions.join('\n        AND ')}
      ORDER BY ${orderBy}
    `,
    values,
  )

  return result.rows
}
