// Feed filters for a shared dev server (frontend#225): narrow the feed by the
// machine, environment, user, Monolog channel, level, release or a tag an
// event carries. The server filters the list (/api/events/preview) and counts
// the values (/api/events/facets); live events carry their values in
// `facets` and are checked here.

// One filter as the bar shows it: `host = web-1` or `channel ≠ doctrine`.
// Tags use the key `tag:<name>`.
export type FeedFilter = {
  key: string
  value: string
  not: boolean
}

// What a live event (preview or WebSocket) says it has: {"host": ["web-1"]}.
export type EventFacets = Record<string, string[]>

export type FacetField = {
  key: string
  label: string
  // Which events send it: said in the field list, so an empty result is no
  // surprise.
  sentBy: string
}

export const FACET_FIELDS: FacetField[] = [
  { key: 'host', label: 'Host', sentBy: 'Sentry, Ray, Inspector, Profiler; Monolog with HostnameProcessor' },
  { key: 'env', label: 'Environment', sentBy: 'Sentry' },
  { key: 'user', label: 'User', sentBy: 'Sentry, Inspector (when sent)' },
  { key: 'channel', label: 'Monolog channel', sentBy: 'Monolog' },
  { key: 'level', label: 'Level', sentBy: 'Sentry, Monolog' },
  { key: 'release', label: 'Release', sentBy: 'Sentry' },
]

export const TAG_PREFIX = 'tag:'
export const NOT_PREFIX = 'not.'

const PLAIN_KEYS = new Set(FACET_FIELDS.map(({ key }) => key))

export const isTagKey = (key: string) => key.startsWith(TAG_PREFIX) && key.length > TAG_PREFIX.length

export const isFacetKey = (key: string) => PLAIN_KEYS.has(key) || isTagKey(key)

// The label of a key: «Host», or the tag's own name.
export const facetLabel = (key: string) =>
  FACET_FIELDS.find((field) => field.key === key)?.label ?? (isTagKey(key) ? key.slice(TAG_PREFIX.length) : key)

const sameFilter = (a: FeedFilter, b: FeedFilter) => a.key === b.key && a.value === b.value && a.not === b.not

// Adds a filter; the same value with the other sign replaces it (`= x` then
// `≠ x` would match nothing).
export const withFilter = (filters: FeedFilter[], next: FeedFilter): FeedFilter[] => {
  if (filters.some((f) => sameFilter(f, next))) {
    return filters
  }
  return [...filters.filter((f) => !(f.key === next.key && f.value === next.value)), next]
}

export const withoutFilter = (filters: FeedFilter[], gone: FeedFilter): FeedFilter[] =>
  filters.filter((f) => !sameFilter(f, gone))

// Query parameters as the server reads them: `host=web-1`, `not.channel=doctrine`,
// `tag=feature:checkout`. Repeated values of one key are OR-ed, keys AND-ed.
export const filtersToParams = (filters: FeedFilter[]): [string, string][] =>
  filters.map(({ key, value, not }) => {
    const [param, paramValue] = isTagKey(key) ? ['tag', `${key.slice(TAG_PREFIX.length)}:${value}`] : [key, value]
    return [`${not ? NOT_PREFIX : ''}${param}`, paramValue]
  })

type QueryValue = string | null | (string | null)[] | undefined

// The filters of a page address (`?host=web-1&not.channel=doctrine`). Other
// parameters are left alone; unknown keys and empty values are dropped.
export const filtersFromQuery = (query: Record<string, QueryValue>): FeedFilter[] => {
  let filters: FeedFilter[] = []
  for (const [param, raw] of Object.entries(query)) {
    const not = param.startsWith(NOT_PREFIX)
    const name = not ? param.slice(NOT_PREFIX.length) : param
    if (name !== 'tag' && !PLAIN_KEYS.has(name)) continue

    for (const item of Array.isArray(raw) ? raw : [raw]) {
      const text = (item ?? '').trim()
      if (!text) continue
      if (name === 'tag') {
        const at = text.indexOf(':')
        const tag = text.slice(0, at).trim()
        if (at < 1 || !tag) continue
        filters = withFilter(filters, { key: `${TAG_PREFIX}${tag}`, value: text.slice(at + 1).trim(), not })
      } else {
        filters = withFilter(filters, { key: name, value: text, not })
      }
    }
  }
  return filters
}

// Whether a query parameter belongs to the filters (and is rewritten by them).
export const isFilterParam = (param: string) => {
  const name = param.startsWith(NOT_PREFIX) ? param.slice(NOT_PREFIX.length) : param
  return name === 'tag' || PLAIN_KEYS.has(name)
}

// A stable text of the filters: compared to tell whether a list reply is
// still for the filters on screen.
export const filtersKey = (filters: FeedFilter[]) =>
  filtersToParams(filters).map(([k, v]) => `${k}=${v}`).sort().join('&')

const norm = (key: string, value: string) => (key === 'level' ? value.toLowerCase() : value)

// The server's rule for a live event: within a key any value matches,
// keys combine with AND. An include needs the event to have the key;
// an exclude keeps events that do not have it.
export const matchesFilters = (facets: EventFacets | undefined, filters: FeedFilter[]): boolean => {
  if (!filters.length) return true

  const groups = new Map<string, FeedFilter[]>()
  for (const f of filters) {
    const id = `${f.not ? '-' : '+'}${f.key}`
    groups.set(id, [...(groups.get(id) ?? []), f])
  }

  for (const group of groups.values()) {
    const { key, not } = group[0]!
    const have = new Set((facets?.[key] ?? []).map((v) => norm(key, v)))
    const hit = group.some(({ value }) => have.has(norm(key, value)))
    if (not ? hit : !hit) return false
  }
  return true
}
