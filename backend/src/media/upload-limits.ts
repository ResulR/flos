export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_REQUEST_BYTES = 30 * 1024 * 1024

export class ImageFileTooLargeError extends Error {
  constructor() {
    super('Image file exceeds the allowed size')
    this.name = 'ImageFileTooLargeError'
  }
}

export class ImageRequestTooLargeError extends Error {
  constructor() {
    super('Image upload request exceeds the allowed total size')
    this.name = 'ImageRequestTooLargeError'
  }
}

export function validateImageFileSize(sizeBytes: number) {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
    throw new TypeError('Image file size must be a non-negative safe integer')
  }

  if (sizeBytes > MAX_IMAGE_FILE_BYTES) {
    throw new ImageFileTooLargeError()
  }
}

export function validateImageUploadSizes(fileSizesBytes: readonly number[]) {
  let totalBytes = 0

  for (const sizeBytes of fileSizesBytes) {
    validateImageFileSize(sizeBytes)

    totalBytes += sizeBytes

    if (
      !Number.isSafeInteger(totalBytes) ||
      totalBytes > MAX_IMAGE_REQUEST_BYTES
    ) {
      throw new ImageRequestTooLargeError()
    }
  }

  return {
    totalBytes,
  }
}
