function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!value) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  return normalizeApiBaseUrl(value)
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${getApiBaseUrl()}${normalizedPath}`
}
