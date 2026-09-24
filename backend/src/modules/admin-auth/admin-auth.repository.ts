import { db } from '../../config/database.js'

export type AdminUserForLogin = {
  id: number
  email: string
  password_hash: string
  is_active: boolean
  session_version: number
}

export async function findAdminUserByEmail(
  email: string,
): Promise<AdminUserForLogin | null> {
  const result = await db.query<AdminUserForLogin>(
    `
      SELECT
        id,
        email,
        password_hash,
        is_active,
        session_version
      FROM admin_users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  )

  return result.rows[0] ?? null
}
