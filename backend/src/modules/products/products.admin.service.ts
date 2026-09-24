import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import {
  findActiveProductReference,
  findAdminProductReferences,
  insertAdminProduct,
  insertAdminProductSpecs,
  upsertProductReference,
} from './products.admin.repository.js'
import type {
  CreateAdminProductBody,
  CreateProductReferenceBody,
} from './products.admin.schemas.js'

export async function getAdminProductReferences() {
  return findAdminProductReferences()
}

export async function createProductReference(
  input: CreateProductReferenceBody,
) {
  return upsertProductReference(input.type, input.name)
}

export type CreatedAdminProduct = {
  id: string
  brandId: string
  bikeTypeId: string
  conditionId: string
  model: string
  year: number | null
  description: string
  priceCents: string
  status: 'available' | 'hidden'
  isActive: boolean
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  createdAt: string
}

export async function createAdminProduct(
  input: CreateAdminProductBody,
): Promise<CreatedAdminProduct> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const brand = await findActiveProductReference(
      client,
      'brand',
      input.brandId,
    )
    const bikeType = await findActiveProductReference(
      client,
      'bikeType',
      input.bikeTypeId,
    )
    const condition = await findActiveProductReference(
      client,
      'condition',
      input.conditionId,
    )

    const fields: Record<string, string> = {}

    if (!brand) {
      fields['body.brandId'] = 'Marque invalide'
    }

    if (!bikeType) {
      fields['body.bikeTypeId'] = 'Type de vélo invalide'
    }

    if (!condition) {
      fields['body.conditionId'] = 'État invalide'
    }

    if (Object.keys(fields).length > 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Requête invalide', fields)
    }

    const product = await insertAdminProduct(client, input)
    const specs = await insertAdminProductSpecs(client, product.id, input.specs)

    await client.query('COMMIT')

    return {
      id: product.id,
      brandId: product.brand_id,
      bikeTypeId: product.bike_type_id,
      conditionId: product.condition_id,
      model: product.model,
      year: product.year,
      description: product.description,
      priceCents: product.price_cents,
      status: product.status,
      isActive: product.is_active,
      specs,
      createdAt: product.created_at.toISOString(),
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
