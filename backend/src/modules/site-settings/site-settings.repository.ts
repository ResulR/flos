import { db } from '../../config/database.js'

export type PublicSiteSettingsRow = {
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  delivery_fee_cents: string
}

export async function findPublicSiteSettings() {
  const result = await db.query<PublicSiteSettingsRow>(
    `
      SELECT
        contact_phone,
        contact_email,
        contact_address,
        delivery_fee_cents::text AS delivery_fee_cents
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

export type UpdateSiteSettingsInput = {
  phone: string | null
  email: string | null
  address: string | null
  deliveryFeeCents: number
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput) {
  const result = await db.query<PublicSiteSettingsRow>(
    `
      UPDATE site_settings
      SET
        contact_phone = $1,
        contact_email = $2,
        contact_address = $3,
        delivery_fee_cents = $4::bigint,
        updated_at = now()
      WHERE id = 1
      RETURNING
        contact_phone,
        contact_email,
        contact_address,
        delivery_fee_cents::text AS delivery_fee_cents
    `,
    [input.phone, input.email, input.address, input.deliveryFeeCents],
  )

  return result.rows[0] ?? null
}
