import { db } from '../../config/database.js'

export type PublicSiteSettingsRow = {
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
}

export async function findPublicSiteSettings() {
  const result = await db.query<PublicSiteSettingsRow>(
    `
      SELECT
        contact_phone,
        contact_email,
        contact_address
      FROM site_settings
      WHERE id = 1
      LIMIT 1
    `,
  )

  return result.rows[0] ?? null
}

export type DeliveryFeeRow = {
  delivery_fee_cents: string
}

export async function findDeliveryFeeCents() {
  const result = await db.query<DeliveryFeeRow>(
    `
      SELECT delivery_fee_cents::text AS delivery_fee_cents
      FROM site_settings
      WHERE id = 1
      LIMIT 1
    `,
  )

  return result.rows[0]?.delivery_fee_cents ?? null
}
