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
