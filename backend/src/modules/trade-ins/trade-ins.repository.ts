import type { PoolClient } from 'pg'

import { db } from '../../config/database.js'
import type { CreateTradeInInput } from './trade-ins.schemas.js'

export type TradeInRow = {
  id: string
  status: 'pending'
  created_at: Date
}

export async function insertTradeIn(
  input: CreateTradeInInput,
): Promise<TradeInRow> {
  const result = await db.query<TradeInRow>(
    `
      INSERT INTO trade_ins (
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        bike_brand,
        bike_model,
        bike_year,
        desired_price_cents,
        description,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        'pending'
      )
      RETURNING
        id::text AS id,
        status,
        created_at
    `,
    [
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      input.brand ?? null,
      input.model ?? null,
      input.year ?? null,
      input.desiredPriceCents ?? null,
      input.description ?? null,
    ],
  )

  const tradeIn = result.rows[0]

  if (!tradeIn) {
    throw new Error('Trade-in insert returned no row')
  }

  return tradeIn
}

export type TradeInStatus =
  'pending' | 'reviewing' | 'accepted' | 'rejected' | 'closed'

export type TradeInStatusRow = {
  id: string
  status: TradeInStatus
  updated_at: Date
}

export async function lockTradeInForStatusUpdate(
  client: PoolClient,
  tradeInId: string,
): Promise<TradeInStatusRow | null> {
  const result = await client.query<TradeInStatusRow>(
    `
      SELECT
        id::text AS id,
        status,
        updated_at
      FROM trade_ins
      WHERE id = $1::bigint
      FOR UPDATE
    `,
    [tradeInId],
  )

  return result.rows[0] ?? null
}

export async function setTradeInStatus(
  client: PoolClient,
  tradeInId: string,
  status: 'reviewing' | 'accepted' | 'rejected',
): Promise<TradeInStatusRow> {
  const result = await client.query<TradeInStatusRow>(
    `
      UPDATE trade_ins
      SET
        status = $2,
        updated_at = now()
      WHERE id = $1::bigint
      RETURNING
        id::text AS id,
        status,
        updated_at
    `,
    [tradeInId, status],
  )

  const tradeIn = result.rows[0]

  if (!tradeIn) {
    throw new Error('Trade-in status update returned no row')
  }

  return tradeIn
}

export type TradeInOfferRow = {
  id: string
  offered_price_cents: string | null
  updated_at: Date
}

export async function updateTradeInOffer(
  tradeInId: string,
  offeredPriceCents: number,
): Promise<TradeInOfferRow | null> {
  const result = await db.query<TradeInOfferRow>(
    `
      UPDATE trade_ins
      SET
        offered_price_cents = $2::bigint,
        updated_at = now()
      WHERE id = $1::bigint
      RETURNING
        id::text AS id,
        offered_price_cents::text AS offered_price_cents,
        updated_at
    `,
    [tradeInId, offeredPriceCents],
  )

  return result.rows[0] ?? null
}

export type TradeInInternalNoteRow = {
  id: string
  internal_note: string | null
  updated_at: Date
}

export async function findTradeInInternalNote(
  tradeInId: string,
): Promise<TradeInInternalNoteRow | null> {
  const result = await db.query<TradeInInternalNoteRow>(
    `
      SELECT
        id::text AS id,
        internal_note,
        updated_at
      FROM trade_ins
      WHERE id = $1::bigint
      LIMIT 1
    `,
    [tradeInId],
  )

  return result.rows[0] ?? null
}

export async function updateTradeInInternalNote(
  tradeInId: string,
  internalNote: string | null,
): Promise<TradeInInternalNoteRow | null> {
  const result = await db.query<TradeInInternalNoteRow>(
    `
      UPDATE trade_ins
      SET
        internal_note = $2,
        updated_at = now()
      WHERE id = $1::bigint
      RETURNING
        id::text AS id,
        internal_note,
        updated_at
    `,
    [tradeInId, internalNote],
  )

  return result.rows[0] ?? null
}
