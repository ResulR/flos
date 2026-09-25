import { randomBytes } from 'node:crypto'
import { mkdir, realpath, writeFile } from 'node:fs/promises'
import { isAbsolute, resolve, sep } from 'node:path'

const MAX_NAME_ATTEMPTS = 5

export type StoredFile = {
  filePath: string
  absolutePath: string
}

function isInsideRoot(root: string, candidate: string) {
  return candidate !== root && candidate.startsWith(`${root}${sep}`)
}

function normalizeExtension(extension: string | undefined) {
  if (extension === undefined) {
    return ''
  }

  const normalized = extension.toLowerCase().replace(/^\./, '')

  if (!/^[a-z0-9]{1,10}$/.test(normalized)) {
    throw new Error('Invalid storage file extension')
  }

  return `.${normalized}`
}

export class PersistentFileStorage {
  constructor(private readonly configuredRoot: string) {
    if (!isAbsolute(configuredRoot)) {
      throw new Error('Persistent storage root must be an absolute path')
    }
  }

  async ensureRoot(): Promise<string> {
    await mkdir(this.configuredRoot, {
      recursive: true,
      mode: 0o750,
    })

    return realpath(this.configuredRoot)
  }

  async save(
    content: Uint8Array,
    options: {
      extension?: string
    } = {},
  ): Promise<StoredFile> {
    const root = await this.ensureRoot()
    const suffix = normalizeExtension(options.extension)

    for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt += 1) {
      const filePath = `${randomBytes(32).toString('hex')}${suffix}`
      const absolutePath = resolve(root, filePath)

      if (!isInsideRoot(root, absolutePath)) {
        throw new Error('Generated storage path escaped its root')
      }

      try {
        await writeFile(absolutePath, content, {
          flag: 'wx',
          mode: 0o640,
        })

        return {
          filePath,
          absolutePath,
        }
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'EEXIST'
        ) {
          continue
        }

        throw error
      }
    }

    throw new Error('Unable to allocate a unique storage filename')
  }

  async resolveExisting(filePath: string): Promise<string | null> {
    if (!filePath || filePath.includes('\0')) {
      return null
    }

    const root = await this.ensureRoot()
    const candidatePath = resolve(root, filePath)

    if (!isInsideRoot(root, candidatePath)) {
      return null
    }

    let absolutePath: string

    try {
      absolutePath = await realpath(candidatePath)
    } catch {
      return null
    }

    if (!isInsideRoot(root, absolutePath)) {
      return null
    }

    return absolutePath
  }
}
