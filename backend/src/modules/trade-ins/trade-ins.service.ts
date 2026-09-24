import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import {
  findAdminTradeInById,
  findAdminTradeIns,
  findTradeInInternalNote,
  insertTradeIn,
  lockTradeInForStatusUpdate,
  setTradeInStatus,
  updateTradeInInternalNote,
  updateTradeInOffer,
} from './trade-ins.repository.js'
import type { CreateTradeInInput } from './trade-ins.schemas.js'

export type CreatedTradeIn = {
  id: string
  status: 'pending'
  createdAt: string
}

export async function createTradeIn(
  input: CreateTradeInInput,
): Promise<CreatedTradeIn> {
  const tradeIn = await insertTradeIn(input)

  return {
    id: tradeIn.id,
    status: tradeIn.status,
    createdAt: tradeIn.created_at.toISOString(),
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
}

export async function getAdminTradeIn(
  tradeInId: string,
): Promise<AdminTradeInDetail> {
  const tradeIn = await findAdminTradeInById(tradeInId)

  if (!tradeIn) {
    throw new AppError(404, 'NOT_FOUND', 'Demande de reprise introuvable')
  }

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
  }
}
