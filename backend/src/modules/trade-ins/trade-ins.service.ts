import { insertTradeIn } from './trade-ins.repository.js'
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
