import { createHash, randomBytes } from 'node:crypto'

import { db } from '../../config/database.js'
import { AppError } from '../../http/errors.js'
import {
  hasActiveReservation,
  hasActiveReservationForContact,
  insertReservation,
  lockProductForReservation,
  lockReservationContact,
  markProductReserved,
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
