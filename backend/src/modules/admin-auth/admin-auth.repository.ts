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

export async function invalidateAdminSession(
  adminId: number,
  sessionVersion: number,
): Promise<boolean> {
  const result = await db.query(
    `
      UPDATE admin_users
      SET
        session_version = session_version + 1,
        updated_at = now()
      WHERE id = $1
        AND session_version = $2
    `,
    [adminId, sessionVersion],
  )

  return (result.rowCount ?? 0) > 0
}

export type ActiveAdminSession = {
  id: number
  email: string
}

export async function findActiveAdminSessionById(
  adminId: number,
  sessionVersion: number,
): Promise<ActiveAdminSession | null> {
  const result = await db.query<ActiveAdminSession>(
    `
      SELECT
        id,
        email
      FROM admin_users
      WHERE id = $1
        AND session_version = $2
        AND is_active = true
      LIMIT 1
    `,
    [adminId, sessionVersion],
  )

  return result.rows[0] ?? null
}
