import assert from 'node:assert/strict'
import test from 'node:test'

import {
  UnsupportedImageFileError,
  detectImageFileType,
  validateImageFile,
} from '../media/image-file-validator.js'

test('detects JPEG from its real file signature', () => {
  const content = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
  ])

  assert.deepEqual(validateImageFile(content), {
    mimeType: 'image/jpeg',
    extension: 'jpg',
  })
})

test('detects PNG from its real file signature', () => {
  const content = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
  ])

  assert.deepEqual(validateImageFile(content), {
    mimeType: 'image/png',
    extension: 'png',
  })
})

test('detects WebP from its RIFF and WEBP signatures', () => {
  const content = Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x20,
  ])

  assert.deepEqual(validateImageFile(content), {
    mimeType: 'image/webp',
    extension: 'webp',
  })
})

test('rejects a text file even if a caller would name it .jpg', () => {
  const content = new TextEncoder().encode(
    'This is plain text pretending to be a JPEG.',
  )

  assert.equal(detectImageFileType(content), null)
  assert.throws(() => validateImageFile(content), UnsupportedImageFileError)
})

test('rejects an executable signature even if a caller would name it .png', () => {
  const content = Uint8Array.from([
    0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
  ])

  assert.equal(detectImageFileType(content), null)
  assert.throws(() => validateImageFile(content), UnsupportedImageFileError)
})

test('rejects GIF because it is not an allowed image format', () => {
  const content = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])

  assert.equal(detectImageFileType(content), null)
})

test('rejects SVG because textual image formats are not allowed', () => {
  const content = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  )

  assert.equal(detectImageFileType(content), null)
})

test('rejects truncated signatures', () => {
  assert.equal(detectImageFileType(Uint8Array.from([0xff, 0xd8])), null)

  assert.equal(
    detectImageFileType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])),
    null,
  )

  assert.equal(
    detectImageFileType(
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45,
      ]),
    ),
    null,
  )
})
