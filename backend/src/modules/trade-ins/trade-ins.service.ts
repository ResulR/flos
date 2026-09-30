import { createHash, randomBytes } from 'node:crypto'

import { db } from '../../config/database.js'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { AppError } from '../../http/errors.js'
import {
  UnsupportedImageFileError,
  validateImageFile,
} from '../../media/image-file-validator.js'
import { PersistentFileStorage } from '../../storage/persistent-file-storage.js'
import {
  findAdminTradeInById,
  findAdminTradeInMedia,
  findAdminTradeInMediaById,
  findAdminTradeIns,
  findTradeInInternalNote,
  getTradeInMediaStats,
  insertTradeIn,
  insertTradeInMedia,
  lockTradeInForMediaUpload,
  lockTradeInForStatusUpdate,
  setTradeInStatus,
  updateTradeInInternalNote,
  updateTradeInOffer,
} from './trade-ins.repository.js'
import type { CreateTradeInInput } from './trade-ins.schemas.js'

const MAX_TRADE_IN_MEDIA_COUNT = 5
const tradeInMediaStorage = new PersistentFileStorage(env.TRADE_IN_MEDIA_ROOT)

function createTradeInUploadToken() {
  return randomBytes(32).toString('base64url')
}

function hashTradeInUploadToken(uploadToken: string) {
  return createHash('sha256').update(uploadToken).digest('hex')
}

export type CreatedTradeIn = {
  id: string
  uploadToken: string
  status: 'pending'
  createdAt: string
}

export async function createTradeIn(
  input: CreateTradeInInput,
): Promise<CreatedTradeIn> {
  const uploadToken = createTradeInUploadToken()
  const tradeIn = await insertTradeIn(
    input,
    hashTradeInUploadToken(uploadToken),
  )

  return {
    id: tradeIn.id,
    uploadToken,
    status: tradeIn.status,
    createdAt: tradeIn.created_at.toISOString(),
  }
}

export type UploadedTradeInMedia = {
  id: string
  displayOrder: number
}

export async function uploadTradeInMedia(
  tradeInId: string,
  uploadToken: string,
  content: Buffer,
): Promise<UploadedTradeInMedia> {
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

    const tradeIn = await lockTradeInForMediaUpload(
      client,
      tradeInId,
      hashTradeInUploadToken(uploadToken),
    )

    if (!tradeIn) {
      throw new AppError(403, 'FORBIDDEN', 'Accès à la reprise refusé')
    }

    const mediaStats = await getTradeInMediaStats(client, tradeInId)

    if (mediaStats.count >= MAX_TRADE_IN_MEDIA_COUNT) {
      throw new AppError(
        409,
        'CONFLICT',
        'Cette reprise possède déjà le maximum de 5 photos.',
      )
    }

    const stored = await tradeInMediaStorage.save(content, {
      extension: imageType.extension,
    })

    storedFilePath = stored.filePath

    const media = await insertTradeInMedia(
      client,
      tradeInId,
      stored.filePath,
      mediaStats.nextDisplayOrder,
    )

    await client.query('COMMIT')

    return {
      id: media.id,
      displayOrder: media.display_order,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)

    if (storedFilePath) {
      await tradeInMediaStorage.remove(storedFilePath).catch((cleanupError) => {
        logger.error(
          {
            err: cleanupError,
            tradeInId,
            filePath: storedFilePath,
          },
          'Unable to clean trade-in media after failed database write',
        )
      })
    }

    throw error
  } finally {
    client.release()
  }
}

export type AdminTradeInStatus = 'reviewing' | 'accepted' | 'rejected'

export type UpdatedTradeInStatus = {
  id: string
  status: AdminTradeInStatus
  updatedAt: string
}

function isAllowedTradeInTransition(
  currentStatus: string,
  nextStatus: AdminTradeInStatus,
): boolean {
  if (currentStatus === 'pending') {
    return nextStatus === 'reviewing'
  }

  if (currentStatus === 'reviewing') {
    return nextStatus === 'accepted' || nextStatus === 'rejected'
  }

  return false
}

export async function updateTradeInStatus(
  tradeInId: string,
  status: AdminTradeInStatus,
): Promise<UpdatedTradeInStatus> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const tradeIn = await lockTradeInForStatusUpdate(client, tradeInId)

    if (!tradeIn) {
      throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
    }

    if (!isAllowedTradeInTransition(tradeIn.status, status)) {
      throw new AppError(
        409,
        'CONFLICT',
        'Transition de statut de reprise invalide',
      )
    }

    const updatedTradeIn = await setTradeInStatus(client, tradeIn.id, status)

    await client.query('COMMIT')

    return {
      id: updatedTradeIn.id,
      status: updatedTradeIn.status as AdminTradeInStatus,
      updatedAt: updatedTradeIn.updated_at.toISOString(),
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type UpdatedTradeInOffer = {
  id: string
  offeredPriceCents: string
  updatedAt: string
}

export async function setTradeInOffer(
  tradeInId: string,
  offeredPriceCents: number,
): Promise<UpdatedTradeInOffer> {
  const tradeIn = await updateTradeInOffer(tradeInId, offeredPriceCents)

  if (!tradeIn || tradeIn.offered_price_cents === null) {
    throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
  }

  return {
    id: tradeIn.id,
    offeredPriceCents: tradeIn.offered_price_cents,
    updatedAt: tradeIn.updated_at.toISOString(),
  }
}

export type TradeInInternalNote = {
  id: string
  internalNote: string | null
  updatedAt: string
}

export async function getTradeInInternalNote(
  tradeInId: string,
): Promise<TradeInInternalNote> {
  const tradeIn = await findTradeInInternalNote(tradeInId)

  if (!tradeIn) {
    throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
  }

  return {
    id: tradeIn.id,
    internalNote: tradeIn.internal_note,
    updatedAt: tradeIn.updated_at.toISOString(),
  }
}

export async function setTradeInInternalNote(
  tradeInId: string,
  internalNote: string | null,
): Promise<TradeInInternalNote> {
  const tradeIn = await updateTradeInInternalNote(tradeInId, internalNote)

  if (!tradeIn) {
    throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
  }

  return {
    id: tradeIn.id,
    internalNote: tradeIn.internal_note,
    updatedAt: tradeIn.updated_at.toISOString(),
  }
}

export type AdminTradeInListItem = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  bikeBrand: string | null
  bikeModel: string | null
  bikeYear: number | null
  desiredPriceCents: string | null
  offeredPriceCents: string | null
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'closed'
  createdAt: string
  updatedAt: string
}

export async function listAdminTradeIns(): Promise<AdminTradeInListItem[]> {
  const tradeIns = await findAdminTradeIns()

  return tradeIns.map((tradeIn) => ({
    id: tradeIn.id,
    customerFirstName: tradeIn.customer_first_name,
    customerLastName: tradeIn.customer_last_name,
    customerEmail: tradeIn.customer_email,
    customerPhone: tradeIn.customer_phone,
    bikeBrand: tradeIn.bike_brand,
    bikeModel: tradeIn.bike_model,
    bikeYear: tradeIn.bike_year,
    desiredPriceCents: tradeIn.desired_price_cents,
    offeredPriceCents: tradeIn.offered_price_cents,
    status: tradeIn.status,
    createdAt: tradeIn.created_at.toISOString(),
    updatedAt: tradeIn.updated_at.toISOString(),
  }))
}

export type AdminTradeInMedia = {
  id: string
  imageUrl: string
  displayOrder: number
}

export type AdminTradeInDetail = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  bikeBrand: string | null
  bikeModel: string | null
  bikeYear: number | null
  description: string | null
  desiredPriceCents: string | null
  offeredPriceCents: string | null
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'closed'
  createdAt: string
  updatedAt: string
  media: AdminTradeInMedia[]
}

export async function getAdminTradeIn(
  tradeInId: string,
): Promise<AdminTradeInDetail> {
  const tradeIn = await findAdminTradeInById(tradeInId)

  if (!tradeIn) {
    throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
  }

  const media = await findAdminTradeInMedia(tradeIn.id)

  return {
    id: tradeIn.id,
    customerFirstName: tradeIn.customer_first_name,
    customerLastName: tradeIn.customer_last_name,
    customerEmail: tradeIn.customer_email,
    customerPhone: tradeIn.customer_phone,
    bikeBrand: tradeIn.bike_brand,
    bikeModel: tradeIn.bike_model,
    bikeYear: tradeIn.bike_year,
    description: tradeIn.description,
    desiredPriceCents: tradeIn.desired_price_cents,
    offeredPriceCents: tradeIn.offered_price_cents,
    status: tradeIn.status,
    createdAt: tradeIn.created_at.toISOString(),
    updatedAt: tradeIn.updated_at.toISOString(),
    media: media.map((item) => ({
      id: item.id,
      imageUrl: `/admin/trade-ins/${tradeIn.id}/media/${item.id}`,
      displayOrder: item.display_order,
    })),
  }
}

export type AdminTradeInMediaFile = {
  absolutePath: string
}

export async function getAdminTradeInMediaFile(
  tradeInId: string,
  mediaId: string,
): Promise<AdminTradeInMediaFile> {
  const media = await findAdminTradeInMediaById(tradeInId, mediaId)

  if (!media) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  const absolutePath = await tradeInMediaStorage.resolveExisting(
    media.file_path,
  )

  if (!absolutePath) {
    throw new AppError(404, 'NOT_FOUND', 'Média introuvable')
  }

  return {
    absolutePath,
  }
}
