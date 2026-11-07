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

// A plain method stays bare; anything else is quoted, so a hostile method
// (Go accepts any token, «`» and «$» included) cannot run in the shell.
const method = (value: string) => (/^[A-Za-z]+$/.test(value) ? value : sq(value))

// The server keeps the decoded path: encode each segment again.
const encodePath = (uri: string) =>
  uri
    .replace(/^\//, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

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
 * Everything in a dump comes from whoever sent it, so the command must not
 * do more than resend the same bytes: every value is single-quoted, the body
 * goes as `--data-raw` and form fields as `--form-string` (a value starting
 * with «@» or «<» stays text instead of reading a local file), and files are
 * only named in a comment.
 *
 * A dump is resent to `origin`, the Buggregator UI being viewed (an app in
 * Docker reaches it as `buggregator:8000`, which the host cannot resolve);
 * `payload.host` is the fallback. A proxied request keeps its own host and
 * scheme (`payload.scheme`, http when missing). The server stores the decoded
 * path (with or without its leading «/») and the query apart.
 */
export const buildCurlCommand = (payload: HttpDump, origin?: string): string => {
  const req = payload.request
  const target = `/${encodePath(req.uri)}${queryString(req.query)}`
  // Only http/https from the payload; anything else falls back to http.
  const scheme = payload.scheme === 'https' ? 'https' : 'http'
  const url = payload.proxy ? `${scheme}://${payload.host}${target}` : `${origin || `http://${payload.host}`}${target}`

  const headers = req.headers || {}
  const multipart = isMultipart(headers)
  const parts = [`curl -X ${method(req.method)} ${sq(url)}`]

  for (const [key, val] of Object.entries(headers)) {
    const name = key.toLowerCase()
    if (SKIP_HEADERS.has(name)) continue
    // curl writes its own multipart Content-Type with a fresh boundary.
    if (multipart && name === 'content-type') continue
    for (const v of [val].flat()) parts.push(`-H ${sq(`${key}: ${v}`)}`)
  }

  const notes: string[] = []
  if (multipart) {
    for (const [key, val] of Object.entries(req.post || {})) {
      for (const v of [val].flat()) parts.push(`--form-string ${sq(`${key}=${String(v)}`)}`)
    }
    for (const file of req.files || []) {
      // A comment line: newlines in the name would end it and start a command.
      const name = file.name.replace(/[\r\n]/g, ' ')
      notes.push(`# file: ${name} (not sent; add -F 'file=@<path>' to attach it)`)
    }
  } else if (req.body) {
    parts.push(`--data-raw ${sq(req.body)}`)
  }

  return [parts.join(' \\\n  '), ...notes].join('\n')
}
