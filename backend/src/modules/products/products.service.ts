import { env } from '../../config/env.js'
import { PersistentFileStorage } from '../../storage/persistent-file-storage.js'
import { AppError } from '../../http/errors.js'
import {
  findPublicProductById,
  findPublicProductFilterOptions,
  findPublicProductMedia,
  findPublicProductMediaById,
  findPublicProductSpecs,
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
  reservedUntil: string | null
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
    reservedUntil:
      row.status === 'reserved' && row.reserved_until
        ? row.reserved_until.toISOString()
        : null,
    imageUrl: null,
  }
}

export async function listPublicProducts(
  filters: PublicProductFilters,
): Promise<PublicProductListItem[]> {
  const products = await findPublicProducts(filters)

  return products.map(toPublicProductListItem)
}

export type PublicProductDetail = {
  id: string
  brand: string
  model: string
  bikeType: string
  condition: string
  year: number | null
  description: string
  priceCents: string
  status: 'available' | 'reserved' | 'sold'
  reservedUntil: string | null
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  media: Array<{
    id: string
    imageUrl: string
  }>
}

export async function getPublicProduct(
  productId: string,
): Promise<PublicProductDetail> {
  const product = await findPublicProductById(productId)

  if (!product) {
    throw new AppError(404, 'NOT_FOUND', 'Produit introuvable')
  }

  const [specs, media] = await Promise.all([
    findPublicProductSpecs(productId),
    findPublicProductMedia(productId),
  ])

  return {
    id: product.id,
    brand: product.brand,
    model: product.model,
    bikeType: product.bike_type,
    condition: product.condition,
    year: product.year,
    description: product.description,
    priceCents: product.price_cents,
    status: product.status,
    reservedUntil:
      product.status === 'reserved' && product.reserved_until
        ? product.reserved_until.toISOString()
        : null,
    specs,
    media: media.map((item) => ({
      id: item.id,
      imageUrl: `/products/${product.id}/media/${item.id}`,
    })),
  }
}

const productMediaStorage = new PersistentFileStorage(env.PRODUCT_MEDIA_ROOT)

export type PublicProductMediaFile = {
  absolutePath: string
}

export async function getPublicProductMediaFile(
  productId: string,
  mediaId: string,
): Promise<PublicProductMediaFile> {
  const media = await findPublicProductMediaById(productId, mediaId)

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

export async function getPublicProductFilterOptions() {
  return findPublicProductFilterOptions()
}
