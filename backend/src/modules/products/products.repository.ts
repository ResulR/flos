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

export type PublicProductDetailRow = {
  id: string
  brand: string
  model: string
  bike_type: string
  condition: string
  year: number | null
  description: string
  price_cents: string
  status: 'available' | 'reserved' | 'sold'
  reserved_until: Date | null
}

export async function findPublicProductById(
  productId: string,
): Promise<PublicProductDetailRow | null> {
  const result = await db.query<PublicProductDetailRow>(
    `
      SELECT
        p.id::text AS id,
        brand.name AS brand,
        p.model,
        bike_type.name AS bike_type,
        condition.name AS condition,
        p.year,
        p.description,
        p.price_cents::text AS price_cents,
        p.status,
        reservation.expires_at AS reserved_until
      FROM products AS p
      INNER JOIN product_brands AS brand
        ON brand.id = p.brand_id
      INNER JOIN bike_types AS bike_type
        ON bike_type.id = p.bike_type_id
      INNER JOIN bike_conditions AS condition
        ON condition.id = p.condition_id
      LEFT JOIN LATERAL (
        SELECT expires_at
        FROM reservations
        WHERE product_id = p.id
          AND status = 'active'
        LIMIT 1
      ) AS reservation ON true
      WHERE p.id = $1::bigint
        AND p.is_active = true
        AND p.deleted_at IS NULL
        AND p.status IN ('available', 'reserved', 'sold')
      LIMIT 1
    `,
    [productId],
  )

  return result.rows[0] ?? null
}

export type PublicProductSpecRow = {
  id: string
  label: string
  value: string
}

export async function findPublicProductSpecs(
  productId: string,
): Promise<PublicProductSpecRow[]> {
  const result = await db.query<PublicProductSpecRow>(
    `
      SELECT
        id::text AS id,
        label,
        value
      FROM product_specs
      WHERE product_id = $1::bigint
      ORDER BY display_order ASC, id ASC
    `,
    [productId],
  )

  return result.rows
}

export type PublicProductMediaRow = {
  id: string
  file_path: string
}

export async function findPublicProductMedia(
  productId: string,
): Promise<PublicProductMediaRow[]> {
  const result = await db.query<PublicProductMediaRow>(
    `
      SELECT
        id::text AS id,
        file_path
      FROM product_media
      WHERE product_id = $1::bigint
      ORDER BY display_order ASC, id ASC
    `,
    [productId],
  )

  return result.rows
}

export async function findPublicProductMediaById(
  productId: string,
  mediaId: string,
): Promise<PublicProductMediaRow | null> {
  const result = await db.query<PublicProductMediaRow>(
    `
      SELECT
        media.id::text AS id,
        media.file_path
      FROM product_media AS media
      INNER JOIN products AS product
        ON product.id = media.product_id
      WHERE media.id = $1::bigint
        AND media.product_id = $2::bigint
        AND product.is_active = true
        AND product.deleted_at IS NULL
        AND product.status IN ('available', 'reserved', 'sold')
      LIMIT 1
    `,
    [mediaId, productId],
  )

  return result.rows[0] ?? null
}

export type PublicProductFilterOptionRow = {
  id: string
  name: string
}

export async function findPublicProductFilterOptions() {
  const [brands, bikeTypes, conditions, years] = await Promise.all([
    db.query<PublicProductFilterOptionRow>(
      `
        SELECT id::text AS id, name
        FROM product_brands
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
    db.query<PublicProductFilterOptionRow>(
      `
        SELECT id::text AS id, name
        FROM bike_types
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
    db.query<PublicProductFilterOptionRow>(
      `
        SELECT id::text AS id, name
        FROM bike_conditions
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
    db.query<{ year: number }>(
      `
        SELECT DISTINCT year
        FROM products
        WHERE is_active = true
          AND deleted_at IS NULL
          AND status IN ('available', 'reserved', 'sold')
          AND year IS NOT NULL
        ORDER BY year DESC
      `,
    ),
  ])

  return {
    brands: brands.rows,
    bikeTypes: bikeTypes.rows,
    conditions: conditions.rows,
    years: years.rows.map((row) => row.year),
  }
}
