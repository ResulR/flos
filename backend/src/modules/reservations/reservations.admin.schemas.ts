import { z } from 'zod'

export const convertReservationStoreSaleParamsSchema = z
  .object({
    reservationId: z.string().regex(/^[1-9]\d*$/, 'Réservation invalide'),
  })
  .strict()

export type ConvertReservationStoreSaleParams = z.infer<
  typeof convertReservationStoreSaleParamsSchema
>
