import { AppError } from '../../http/errors.js'
import { verifyAdminPassword } from './admin-auth.password.js'
import { findAdminUserByEmail } from './admin-auth.repository.js'
import type { AdminLoginInput } from './admin-auth.schemas.js'
import { createAdminSessionToken } from './admin-auth.session.js'

const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$Zmxvcy1iaWtlcy1hZG1pbi1kdW1teS1zYWx0LXYx$hKHZCFp5atuGxapNqK9SR7ZyRyaDI6rwms5OU7IxDCQXpFTgrqgCWCq9aZS3lWv3JnmUyXEH9YWW0sIR2KwCYg'

const INVALID_CREDENTIALS_MESSAGE = 'Email ou mot de passe incorrect.'

export type AdminLoginResult = {
  sessionToken: string
}

export async function loginAdmin(
  input: AdminLoginInput,
): Promise<AdminLoginResult> {
  const admin = await findAdminUserByEmail(input.email)

  const passwordMatches = await verifyAdminPassword(
    input.password,
    admin?.password_hash ?? DUMMY_PASSWORD_HASH,
  )

  if (!admin || !admin.is_active || !passwordMatches) {
    throw new AppError(401, 'UNAUTHENTICATED', INVALID_CREDENTIALS_MESSAGE)
  }

  return {
    sessionToken: createAdminSessionToken({
      adminId: admin.id,
      sessionVersion: admin.session_version,
    }),
  }
}
