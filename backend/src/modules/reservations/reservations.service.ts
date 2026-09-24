import { createHash, randomBytes } from 'node:crypto'

import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import {
  findReservationByPurchaseTokenHash,
  hasActiveReservation,
  hasActiveReservationForContact,
  insertReservation,
  lockProductForReservation,
  lockReservationContact,
  lockReservationForAdminCancellation,
  markDueReservationsExpired,
  markProductReserved,
  markReservationCancelled,
  releaseProductsWithoutActiveReservation,
} from './reservations.repository.js'
import type { CreateReservationInput } from './reservations.schemas.js'

export type CreatedReservation = {
  id: string
  productId: string
  expiresAt: string
  status: 'active'
  cancelToken: string
  purchaseToken: string
}

function createSecret() {
  return randomBytes(32).toString('base64url')
}

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex')
}

export type ReservationAccess = {
  reservationId: string
  productId: string
}

export async function validateReservationPurchaseAccess(
  reservationId: string,
  purchaseToken: string,
): Promise<ReservationAccess> {
  const reservation = await findReservationByPurchaseTokenHash(
    reservationId,
    hashSecret(purchaseToken),
  )

  if (!reservation) {
    throw new AppError(
      403,
      'RESERVATION_ACCESS_DENIED',
      'Accès à la réservation refusé',
    )
  }

  return {
    reservationId: reservation.id,
    productId: reservation.product_id,
  }
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<CreatedReservation> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const product = await lockProductForReservation(client, input.productId)

    if (
      !product ||
      !product.is_active ||
      product.deleted_at !== null ||
      product.status !== 'available'
    ) {
      throw new AppError(409, 'PRODUCT_NOT_AVAILABLE', 'Produit indisponible')
    }

    if (await hasActiveReservation(client, input.productId)) {
      throw new AppError(409, 'PRODUCT_NOT_AVAILABLE', 'Produit indisponible')
    }

    await lockReservationContact(client, input.email, input.phone)

    if (
      await hasActiveReservationForContact(client, input.email, input.phone)
    ) {
      throw new AppError(
        409,
        'RESERVATION_LIMIT_REACHED',
        'Une réservation active existe déjà pour ce contact',
      )
    }

    const cancelToken = createSecret()
    const purchaseToken = createSecret()

    const reservation = await insertReservation(client, {
      productId: input.productId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      durationDays: input.durationDays,
      cancelTokenHash: hashSecret(cancelToken),
      purchaseTokenHash: hashSecret(purchaseToken),
    })

    await markProductReserved(client, input.productId)

    await client.query('COMMIT')

    return {
      id: reservation.id,
      productId: reservation.product_id,
      expiresAt: reservation.expires_at.toISOString(),
      status: reservation.status,
      cancelToken,
      purchaseToken,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type ExpireDueReservationsResult = {
  expiredReservations: number
  releasedProducts: number
}

export async function expireDueReservations(): Promise<ExpireDueReservationsResult> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const productIds = await markDueReservationsExpired(client)
    const releasedProducts = await releaseProductsWithoutActiveReservation(
      client,
      productIds,
    )

    await client.query('COMMIT')

    return {
      expiredReservations: productIds.length,
      releasedProducts,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export type CancelledReservation = {
  id: string
  productId: string
  status: 'cancelled'
  productStatus: 'available'
}

export async function cancelReservationManually(
  reservationId: string,
): Promise<CancelledReservation> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const reservation = await lockReservationForAdminCancellation(
      client,
      reservationId,
    )

    if (!reservation) {
      throw new AppError(404, 'NOT_FOUND', 'Réservation introuvable')
    }

    if (reservation.status === 'expired' || reservation.is_expired) {
      throw new AppError(410, 'RESERVATION_EXPIRED', 'La réservation a expiré')
    }

    if (reservation.status !== 'active') {
      throw new AppError(
        409,
        'CONFLICT',
        'La réservation ne peut plus être annulée',
      )
    }

    await markReservationCancelled(client, reservation.id)

    const releasedProducts = await releaseProductsWithoutActiveReservation(
      client,
      [reservation.product_id],
    )

    if (releasedProducts !== 1) {
      throw new Error('Reserved product was not released')
    }

    await client.query('COMMIT')

    return {
      id: reservation.id,
      productId: reservation.product_id,
      status: 'cancelled',
      productStatus: 'available',
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
