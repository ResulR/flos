import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ImageFileTooLargeError,
  ImageRequestTooLargeError,
  MAX_IMAGE_FILE_BYTES,
  MAX_IMAGE_REQUEST_BYTES,
  validateImageFileSize,
  validateImageUploadSizes,
} from '../media/upload-limits.js'

test('allows an image exactly at the per-file limit', () => {
  assert.doesNotThrow(() => validateImageFileSize(MAX_IMAGE_FILE_BYTES))
})

test('rejects an image one byte above the per-file limit', () => {
  assert.throws(
    () => validateImageFileSize(MAX_IMAGE_FILE_BYTES + 1),
    ImageFileTooLargeError,
  )
})

test('allows a request exactly at the total request limit', () => {
  const result = validateImageUploadSizes([
    MAX_IMAGE_FILE_BYTES,
    MAX_IMAGE_FILE_BYTES,
    MAX_IMAGE_FILE_BYTES,
  ])

  assert.equal(result.totalBytes, MAX_IMAGE_REQUEST_BYTES)
})

test('rejects a request one byte above the total request limit', () => {
  assert.throws(
    () =>
      validateImageUploadSizes([
        MAX_IMAGE_FILE_BYTES,
        MAX_IMAGE_FILE_BYTES,
        MAX_IMAGE_FILE_BYTES,
        1,
      ]),
    ImageRequestTooLargeError,
  )
})

test('checks the individual file limit before the total request limit', () => {
  assert.throws(
    () => validateImageUploadSizes([MAX_IMAGE_FILE_BYTES + 1]),
    ImageFileTooLargeError,
  )
})

test('allows an empty upload set', () => {
  assert.deepEqual(validateImageUploadSizes([]), {
    totalBytes: 0,
  })
})

test('rejects negative file sizes', () => {
  assert.throws(() => validateImageFileSize(-1), TypeError)
})

test('rejects non-integer file sizes', () => {
  assert.throws(() => validateImageFileSize(1.5), TypeError)
})

test('rejects unsafe integer file sizes', () => {
  assert.throws(
    () => validateImageFileSize(Number.MAX_SAFE_INTEGER + 1),
    TypeError,
  )
})
