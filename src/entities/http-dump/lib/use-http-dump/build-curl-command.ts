import type { HttpDump } from '../../types'

// Wraps a value in single quotes for a POSIX shell.
const sq = (value: string) => `'${value.replace(/'/g, "'\\''")}'`

// Headers curl sets itself; copying them breaks the request (length, boundary).
const SKIP_HEADERS = new Set(['host', 'content-length'])

const isMultipart = (headers: Record<string, string[] | string>) =>
  Object.entries(headers).some(
    ([key, val]) =>
      key.toLowerCase() === 'content-type' && [val].flat().some((v) => v.includes('multipart/form-data')),
  )

const queryString = (query: Record<string, unknown> | undefined) => {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(query || {})) {
    for (const v of [val].flat()) params.append(key, String(v))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/**
 * A cURL command that sends the captured request again.
 *
 * The Go server stores the host in `payload.host` (not in the headers), the
 * path without its leading «/» and the query separately; multipart bodies are
 * stored as `post` fields and `files`, so they become `-F` parts.
 */
export const buildCurlCommand = (payload: HttpDump): string => {
  const req = payload.request
  const path = req.uri.startsWith('/') ? req.uri : `/${req.uri}`
  const url = payload.proxy
    ? `${payload.host}${path}${queryString(req.query)}`
    : `http://${payload.host}${path}${queryString(req.query)}`

  const headers = req.headers || {}
  const multipart = isMultipart(headers)
  const parts = [`curl -X ${req.method} ${sq(url)}`]

  for (const [key, val] of Object.entries(headers)) {
    const name = key.toLowerCase()
    if (SKIP_HEADERS.has(name)) continue
    // curl writes its own multipart Content-Type with a fresh boundary.
    if (multipart && name === 'content-type') continue
    for (const v of [val].flat()) parts.push(`-H ${sq(`${key}: ${v}`)}`)
  }

  if (multipart) {
    for (const [key, val] of Object.entries(req.post || {})) {
      for (const v of [val].flat()) parts.push(`-F ${sq(`${key}=${String(v)}`)}`)
    }
    for (const file of req.files || []) {
      parts.push(`-F ${sq(`file=@${file.name}`)}`)
    }
  } else if (req.body) {
    parts.push(`-d ${sq(req.body)}`)
  }

  return parts.join(' \\\n  ')
}
