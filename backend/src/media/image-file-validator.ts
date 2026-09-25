export type SupportedImageType = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  extension: 'jpg' | 'png' | 'webp'
}

export class UnsupportedImageFileError extends Error {
  constructor() {
    super('Unsupported or invalid image file')
    this.name = 'UnsupportedImageFileError'
  }
}

function startsWithBytes(content: Uint8Array, signature: readonly number[]) {
  if (content.length < signature.length) {
    return false
  }

  return signature.every((byte, index) => content[index] === byte)
}

function isJpeg(content: Uint8Array) {
  return startsWithBytes(content, [0xff, 0xd8, 0xff])
}

function isPng(content: Uint8Array) {
  return startsWithBytes(
    content,
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  )
}

function isWebp(content: Uint8Array) {
  if (content.length < 12) {
    return false
  }

  return (
    startsWithBytes(content, [0x52, 0x49, 0x46, 0x46]) &&
    content[8] === 0x57 &&
    content[9] === 0x45 &&
    content[10] === 0x42 &&
    content[11] === 0x50
  )
}

export function detectImageFileType(
  content: Uint8Array,
): SupportedImageType | null {
  if (isJpeg(content)) {
    return {
      mimeType: 'image/jpeg',
      extension: 'jpg',
    }
  }

  if (isPng(content)) {
    return {
      mimeType: 'image/png',
      extension: 'png',
    }
  }

  if (isWebp(content)) {
    return {
      mimeType: 'image/webp',
      extension: 'webp',
    }
  }

  return null
}

export function validateImageFile(content: Uint8Array): SupportedImageType {
  const detectedType = detectImageFileType(content)

  if (!detectedType) {
    throw new UnsupportedImageFileError()
  }

  return detectedType
}
