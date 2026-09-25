import { db } from '../../config/database.js'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../http/errors.js'
import {
  UnsupportedImageFileError,
  validateImageFile,
} from '../../media/image-file-validator.js'
import {
  ImageFileTooLargeError,
  ImageRequestTooLargeError,
  validateImageUploadSizes,
} from '../../media/upload-limits.js'
import { PersistentFileStorage } from '../../storage/persistent-file-storage.js'
import { hasActiveReservation } from '../reservations/reservations.repository.js'
import {
  findActiveProductReference,
  findAdminProductById,
  findAdminProductMedia,
  findAdminProductMediaById,
  findAdminProductReferences,
  findAdminProducts,
  findAdminProductSpecs,
  getAdminProductMediaStats,
  insertAdminProduct,
  insertAdminProductMedia,
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

const MAX_PRODUCT_MEDIA_COUNT = 10
const productMediaStorage = new PersistentFileStorage(env.PRODUCT_MEDIA_ROOT)

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
  media: Array<{
    id: string
    imageUrl: string
    displayOrder: number
  }>
  createdAt: string
  updatedAt: string
}

function toAdminProductDetail(
  product: AdminProductRow,
  specs: AdminProductDetail['specs'],
  media: AdminProductDetail['media'],
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
    media,
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

  const [specs, mediaRows] = await Promise.all([
    findAdminProductSpecs(productId),
    findAdminProductMedia(productId),
  ])

  const media = mediaRows.map((item) => ({
    id: item.id,
    imageUrl: `/admin/products/${productId}/media/${item.id}`,
    displayOrder: item.display_order,
  }))

  return toAdminProductDetail(product, specs, media)
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

    const mediaRows = await findAdminProductMedia(productId)
    const media = mediaRows.map((item) => ({
      id: item.id,
      imageUrl: `/admin/products/${productId}/media/${item.id}`,
      displayOrder: item.display_order,
    }))

    return toAdminProductDetail(product, specs, media)
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

export type AdminProductListItem = {
  id: string
  brand: string
  model: string
  bikeType: string
  condition: string
  year: number | null
  priceCents: string
  status: AdminProductStatus
  isActive: boolean
  updatedAt: string
}

export async function listAdminProducts(): Promise<AdminProductListItem[]> {
  const products = await findAdminProducts()

  return products.map((product) => ({
    id: product.id,
    brand: product.brand,
    model: product.model,
    bikeType: product.bike_type,
    condition: product.condition,
    year: product.year,
    priceCents: product.price_cents,
    status: product.status,
    isActive: product.is_active,
    updatedAt: product.updated_at.toISOString(),
  }))
}

export type AdminProductMedia = {
  id: string
  imageUrl: string
  displayOrder: number
}

export async function uploadAdminProductMedia(
  productId: string,
  content: Uint8Array,
): Promise<AdminProductMedia> {
  try {
    validateImageUploadSizes([content.byteLength])
  } catch (error) {
    if (
      error instanceof ImageFileTooLargeError ||
      error instanceof ImageRequestTooLargeError
    ) {
      throw new AppError(
        413,
        'VALIDATION_ERROR',
        'Image trop volumineuse. Taille maximale : 10 Mo.',
      )
    }

    throw error
  }

  let imageType

  try {
    imageType = validateImageFile(content)
  } catch (error) {
    if (error instanceof UnsupportedImageFileError) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Format image invalide. Formats acceptés : JPEG, PNG ou WebP.',
      )
    }

    throw error
  }

  const client = await db.connect()
  let storedFilePath: string | null = null

  try {
    await client.query('BEGIN')

    const product = await lockAdminProductById(client, productId)

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Produit introuvable')
    }

    const mediaStats = await getAdminProductMediaStats(client, productId)

    if (mediaStats.count >= MAX_PRODUCT_MEDIA_COUNT) {
      throw new AppError(
        409,
        'CONFLICT',
        'Ce vélo possède déjà le maximum de 10 photos.',
      )
    }

    const stored = await productMediaStorage.save(content, {
      extension: imageType.extension,
    })

    storedFilePath = stored.filePath

    const media = await insertAdminProductMedia(
      client,
      productId,
      stored.filePath,
      mediaStats.nextDisplayOrder,
    )

    await client.query('COMMIT')

    return {
      id: media.id,
      imageUrl: `/admin/products/${productId}/media/${media.id}`,
      displayOrder: media.display_order,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)

    if (storedFilePath) {
      await productMediaStorage.remove(storedFilePath).catch((cleanupError) => {
        logger.error(
          {
            err: cleanupError,
            productId,
            filePath: storedFilePath,
          },
          'Unable to clean product media after failed database write',
        )
      })
    }

    throw error
  } finally {
    client.release()
  }
}

export async function getAdminProductMediaFile(
  productId: string,
  mediaId: string,
): Promise<{
  absolutePath: string
}> {
  const media = await findAdminProductMediaById(productId, mediaId)

  if (!media) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  const absolutePath = await productMediaStorage.resolveExisting(
    media.file_path,
  )

  if (!absolutePath) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  return {
    absolutePath,
  }
}
