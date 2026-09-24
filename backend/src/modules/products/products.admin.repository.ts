import type { PoolClient } from 'pg'

import { db } from '../../config/database.js'
import type {
  CreateAdminProductBody,
  ProductReferenceType,
} from './products.admin.schemas.js'

export type ProductReferenceRow = {
  id: string
  name: string
}

function getReferenceTable(type: ProductReferenceType) {
  switch (type) {
    case 'brand':
      return 'product_brands'
    case 'bikeType':
      return 'bike_types'
    case 'condition':
      return 'bike_conditions'
  }
}

export async function findAdminProductReferences() {
  const [brands, bikeTypes, conditions] = await Promise.all([
    db.query<ProductReferenceRow>(
      `
        SELECT
          id::text AS id,
          name
        FROM product_brands
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
    db.query<ProductReferenceRow>(
      `
        SELECT
          id::text AS id,
          name
        FROM bike_types
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
    db.query<ProductReferenceRow>(
      `
        SELECT
          id::text AS id,
          name
        FROM bike_conditions
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC, id ASC
      `,
    ),
  ])

  return {
    brands: brands.rows,
    bikeTypes: bikeTypes.rows,
    conditions: conditions.rows,
  }
}

export async function upsertProductReference(
  type: ProductReferenceType,
  name: string,
): Promise<ProductReferenceRow> {
  const table = getReferenceTable(type)

  const result = await db.query<ProductReferenceRow>(
    `
      INSERT INTO ${table} (
        name
      )
      VALUES ($1)
      ON CONFLICT (lower(name))
      DO UPDATE SET
        updated_at = ${table}.updated_at
      RETURNING
        id::text AS id,
        name
    `,
    [name],
  )

  const reference = result.rows[0]

  if (!reference) {
    throw new Error('Product reference insert returned no row')
  }

  return reference
}

export async function findActiveProductReference(
  client: PoolClient,
  type: ProductReferenceType,
  id: string,
): Promise<ProductReferenceRow | null> {
  const table = getReferenceTable(type)

  const result = await client.query<ProductReferenceRow>(
    `
      SELECT
        id::text AS id,
        name
      FROM ${table}
      WHERE id = $1::bigint
        AND is_active = true
      LIMIT 1
    `,
    [id],
  )

  return result.rows[0] ?? null
}

export type CreatedProductRow = {
  id: string
  brand_id: string
  bike_type_id: string
  condition_id: string
  model: string
  year: number | null
  description: string
  price_cents: string
  status: 'available' | 'hidden'
  is_active: boolean
  created_at: Date
}

export async function insertAdminProduct(
  client: PoolClient,
  input: CreateAdminProductBody,
): Promise<CreatedProductRow> {
  const result = await client.query<CreatedProductRow>(
    `
      INSERT INTO products (
        brand_id,
        bike_type_id,
        condition_id,
        model,
        year,
        description,
        price_cents,
        status,
        is_active
      )
      VALUES (
        $1::bigint,
        $2::bigint,
        $3::bigint,
        $4,
        $5,
        $6,
        $7::bigint,
        $8,
        $9
      )
      RETURNING
        id::text AS id,
        brand_id::text AS brand_id,
        bike_type_id::text AS bike_type_id,
        condition_id::text AS condition_id,
        model,
        year,
        description,
        price_cents::text AS price_cents,
        status,
        is_active,
        created_at
    `,
    [
      input.brandId,
      input.bikeTypeId,
      input.conditionId,
      input.model,
      input.year,
      input.description,
      input.priceCents,
      input.status,
      input.isActive,
    ],
  )

  const product = result.rows[0]

  if (!product) {
    throw new Error('Product insert returned no row')
  }

  return product
}

export type CreatedProductSpecRow = {
  id: string
  label: string
  value: string
}

export async function insertAdminProductSpecs(
  client: PoolClient,
  productId: string,
  specs: CreateAdminProductBody['specs'],
): Promise<CreatedProductSpecRow[]> {
  const createdSpecs: CreatedProductSpecRow[] = []

  for (const [index, spec] of specs.entries()) {
    const result = await client.query<CreatedProductSpecRow>(
      `
        INSERT INTO product_specs (
          product_id,
          label,
          value,
          display_order
        )
        VALUES (
          $1::bigint,
          $2,
          $3,
          $4
        )
        RETURNING
          id::text AS id,
          label,
          value
      `,
      [productId, spec.label, spec.value, index],
    )

    const createdSpec = result.rows[0]

    if (!createdSpec) {
      throw new Error('Product spec insert returned no row')
    }

    createdSpecs.push(createdSpec)
  }

  return createdSpecs
}
