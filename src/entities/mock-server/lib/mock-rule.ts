import type { MockMethod, MockRuleErrors, MockRuleInput } from '../types'

// Mirrors the server's limits and checks (modules/httpdumps/mock.go), so the
// form can show the error before a round trip; the server's 422 still wins.
export const MOCK_PREFIX = '/mock'
export const MAX_BODY_BYTES = 1024 * 1024
export const MAX_DELAY_MS = 30000

export type PathPart = { text: string; kind: 'text' | 'param' | 'wildcard' }

// Splits a rule path into plain text, `{param}` and a trailing `*`, for colouring.
export const pathParts = (path: string): PathPart[] => {
  const parts: PathPart[] = []
  const push = (text: string, kind: PathPart['kind']) => {
    const last = parts[parts.length - 1]
    if (kind === 'text' && last?.kind === 'text') {
      last.text += text
    } else if (text) {
      parts.push({ text, kind })
    }
  }

  path.split(/(\/)/).forEach((seg) => {
    if (/^\{[^/]+\}$/.test(seg)) push(seg, 'param')
    else if (seg === '*') push(seg, 'wildcard')
    else push(seg, 'text')
  })

  return parts
}

// The request URI as the rule sees it: without the /mock prefix. The HTTP
// dump stores the URI without its leading slash (`mock/users/1`).
export const requestPath = (uri: string): string => {
  const full = uri.startsWith('/') ? uri : `/${uri}`
  const isMock = full === MOCK_PREFIX || /^\/mock[/?]/.test(full)
  const rest = isMock ? full.slice(MOCK_PREFIX.length) : full
  return rest === '' || rest.startsWith('?') ? `/${rest}` : rest
}

// The dump keeps the query apart from the URI; put it back for display.
export const withQuery = (path: string, query: Record<string, unknown> | undefined): string => {
  if (path.includes('?') || !query || !Object.keys(query).length) return path
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    const values = Array.isArray(v) ? v : [v]
    values.forEach((x) => qs.append(k, typeof x === 'string' ? x : JSON.stringify(x)))
  })
  return `${path}?${qs}`
}

export const bodyBytes = (body: string): number => new TextEncoder().encode(body).length

const pathError = (path: string): string | undefined => {
  if (!path.startsWith('/')) return 'Path must start with “/”.'
  const segs = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (s === '*') {
      if (i !== segs.length - 1) return '“*” is allowed only as the last segment.'
    } else if (s.includes('*')) {
      return '“*” must be a whole segment.'
    } else if (s.startsWith('{') || s.endsWith('}')) {
      if (s.length < 3 || !s.startsWith('{') || !s.endsWith('}')) return 'Every “{” needs a closing “}”.'
    }
  }
  return undefined
}

export const validateRule = (rule: MockRuleInput): MockRuleErrors => {
  const errors: MockRuleErrors = {}

  const path = pathError(rule.path.trim())
  if (path) errors.path = path

  if (!Number.isInteger(rule.status) || rule.status < 100 || rule.status > 599) {
    errors.status = 'Status must be between 100 and 599.'
  }
  if (!Number.isInteger(rule.delay_ms) || rule.delay_ms < 0 || rule.delay_ms > MAX_DELAY_MS) {
    errors.delay_ms = `Delay must be between 0 and ${MAX_DELAY_MS} ms.`
  }
  // the seed field shows only with the template on
  if (rule.template && !Number.isInteger(rule.seed)) {
    errors.seed = 'Seed must be a whole number.'
  }
  if (bodyBytes(rule.body) > MAX_BODY_BYTES) {
    errors.body = 'Body must be at most 1 MB.'
  }
  const names = Object.keys(rule.headers)
  const twice = names.find((k, i) => names.findIndex((x) => x.toLowerCase() === k.toLowerCase()) !== i)
  if (names.some((k) => !k.trim() || /[\s:]/.test(k))) {
    errors.headers = 'Header names cannot be empty or contain spaces or “:”.'
  } else if (twice) {
    errors.headers = `Header “${twice}” is set twice.`
  }

  return errors
}

export const emptyDraft = (): MockRuleInput => ({
  project: '',
  name: '',
  method: 'GET',
  path: '',
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '',
  delay_ms: 0,
  enabled: true,
  template: false,
  seed: 0,
})

const ID_SEGMENT = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

// A new rule prefilled from a captured request: numeric and UUID segments
// become `{id}`, the query string is dropped (the matcher ignores it).
export const draftFromRequest = (method: string, uri: string, project: string): MockRuleInput => {
  const path = requestPath(uri).split('?')[0]
  const generic = path
    .split('/')
    .map((seg) => (ID_SEGMENT.test(seg) ? '{id}' : seg))
    .join('/')

  return {
    ...emptyDraft(),
    method: method.toUpperCase() as MockMethod,
    path: generic || '/',
    project,
  }
}
