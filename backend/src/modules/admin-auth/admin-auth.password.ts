import { scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const COST = 16384
const BLOCK_SIZE = 8
const PARALLELIZATION = 1

export const ADMIN_PASSWORD_HASH_PREFIX = 'scrypt'

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error)
          return
        }

        resolve(derivedKey)
      },
    )
  })
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$')

  if (parts.length !== 6) {
    return false
  }

  const [
    algorithm,
    costRaw,
    blockSizeRaw,
    parallelizationRaw,
    saltEncoded,
    expectedEncoded,
  ] = parts

  if (
    algorithm !== ADMIN_PASSWORD_HASH_PREFIX ||
    costRaw === undefined ||
    blockSizeRaw === undefined ||
    parallelizationRaw === undefined ||
    saltEncoded === undefined ||
    expectedEncoded === undefined
  ) {
    return false
  }

  const cost = Number(costRaw)
  const blockSize = Number(blockSizeRaw)
  const parallelization = Number(parallelizationRaw)

  if (
    !Number.isSafeInteger(cost) ||
    !Number.isSafeInteger(blockSize) ||
    !Number.isSafeInteger(parallelization) ||
    cost !== COST ||
    blockSize !== BLOCK_SIZE ||
    parallelization !== PARALLELIZATION
  ) {
    return false
  }

  let salt: Buffer
  let expected: Buffer

  try {
    salt = Buffer.from(saltEncoded, 'base64url')
    expected = Buffer.from(expectedEncoded, 'base64url')
  } catch {
    return false
  }

  if (salt.length === 0 || expected.length !== KEY_LENGTH) {
    return false
  }

  const derived = await deriveKey(password, salt)

  return timingSafeEqual(derived, expected)
}
