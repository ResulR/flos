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
