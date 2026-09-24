import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import {
  insertTradeIn,
  lockTradeInForStatusUpdate,
  setTradeInStatus,
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
