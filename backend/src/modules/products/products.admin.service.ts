import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import { hasActiveReservation } from '../reservations/reservations.repository.js'
import {
  findActiveProductReference,
  findAdminProductById,
  findAdminProductReferences,
  findAdminProductSpecs,
  insertAdminProduct,
  insertAdminProductSpecs,
  lockAdminProductById,
  replaceAdminProductSpecs,
  softDeleteAdminProduct,
  updateAdminProduct,
  upsertProductReference,
  type AdminProductRow,
  type AdminProductStatus,
} from './products.admin.repository.js'
import type {
  CreateAdminProductBody,
  CreateProductReferenceBody,
  UpdateAdminProductBody,
} from './products.admin.schemas.js'

export async function getAdminProductReferences() {
  return findAdminProductReferences()
}

export async function createProductReference(
  input: CreateProductReferenceBody,
) {
  return upsertProductReference(input.type, input.name)
}

export type AdminProductDetail = {
  id: string
  brandId: string
  bikeTypeId: string
  conditionId: string
  model: string
  year: number | null
  description: string
  priceCents: string
  status: AdminProductStatus
  isActive: boolean
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  createdAt: string
  updatedAt: string
}

function toAdminProductDetail(
  product: AdminProductRow,
  specs: AdminProductDetail['specs'],
): AdminProductDetail {
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
    updatedAt: product.updated_at.toISOString(),
  }
}

export async function getAdminProduct(
  productId: string,
): Promise<AdminProductDetail> {
  const product = await findAdminProductById(productId)

  if (!product) {
    throw new AppError(404, 'NOT_FOUND', 'Produit introuvable')
  }

  const specs = await findAdminProductSpecs(productId)

  return toAdminProductDetail(product, specs)
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

async function validateProductReferences(
  client: Parameters<typeof findActiveProductReference>[0],
  input: {
    brandId: string
    bikeTypeId: string
    conditionId: string
  },
) {
  const brand = await findActiveProductReference(client, 'brand', input.brandId)
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
}

export async function createAdminProduct(
  input: CreateAdminProductBody,
): Promise<CreatedAdminProduct> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    await validateProductReferences(client, input)

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

export async function updateAdminProductDetails(
  productId: string,
  input: UpdateAdminProductBody,
): Promise<AdminProductDetail> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const existing = await lockAdminProductById(client, productId)

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Produit introuvable')
    }

    await validateProductReferences(client, input)

    if (
      input.status !== undefined &&
      (existing.status === 'reserved' || existing.status === 'sold')
    ) {
      throw new AppError(
        409,
        'CONFLICT',
        'Le statut réservé ou vendu est géré par le workflow métier.',
      )
    }

    const nextStatus = input.status ?? existing.status

    const product = await updateAdminProduct(
      client,
      productId,
      input,
      nextStatus,
    )
    const specs = await replaceAdminProductSpecs(client, productId, input.specs)

    await client.query('COMMIT')

    return toAdminProductDetail(product, specs)
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type SoftDeletedAdminProduct = {
  id: string
  deletedAt: string
}

export async function deleteAdminProduct(
  productId: string,
): Promise<SoftDeletedAdminProduct> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const product = await lockAdminProductById(client, productId)

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Produit introuvable')
    }

    const activeReservation = await hasActiveReservation(client, productId)

    if (activeReservation) {
      throw new AppError(
        409,
        'CONFLICT',
        'Ce vélo possède une réservation active. Annulez d’abord la réservation.',
      )
    }

    const deletedProduct = await softDeleteAdminProduct(client, productId)

    await client.query('COMMIT')

    return {
      id: deletedProduct.id,
      deletedAt: deletedProduct.deleted_at.toISOString(),
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
