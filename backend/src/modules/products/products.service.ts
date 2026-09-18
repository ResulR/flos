import { realpath } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

import { env } from '../../config/env.js'
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

  const mediaRoot = await realpath(resolve(env.PRODUCT_MEDIA_ROOT))
  const candidatePath = resolve(mediaRoot, media.file_path)

  if (
    candidatePath !== mediaRoot &&
    !candidatePath.startsWith(`${mediaRoot}${sep}`)
  ) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  let absolutePath: string

  try {
    absolutePath = await realpath(candidatePath)
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  if (
    absolutePath === mediaRoot ||
    !absolutePath.startsWith(`${mediaRoot}${sep}`)
  ) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  return {
    absolutePath,
  }
}

export async function getPublicProductFilterOptions() {
  return findPublicProductFilterOptions()
}
