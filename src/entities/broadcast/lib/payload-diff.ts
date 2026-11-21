// What changed in a broadcast's data since the previous event with the same
// name on the same channel (#6614, design #6598 variant B): «order.status:
// "packed" → null» answers «why did the page not update».

export type PayloadChangeKind = 'added' | 'removed' | 'changed'

export type PayloadChange = {
  // `order.status`, `items[2].sku`, `["a.b"]`; '' is the whole payload.
  path: string
  kind: PayloadChangeKind
  before?: unknown
  after?: unknown
}

const PLAIN_KEY = /^[A-Za-z_$][\w$-]*$/

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export const joinKey = (path: string, key: string): string => {
  if (PLAIN_KEY.test(key)) return path ? `${path}.${key}` : key
  return `${path}[${JSON.stringify(key)}]`
}

export const joinIndex = (path: string, index: number): string => `${path}[${index}]`

// Not a deep-equal for any value: JSON values only (no dates, maps, NaN).
const walk = (before: unknown, after: unknown, path: string, out: PayloadChange[]) => {
  if (Array.isArray(before) && Array.isArray(after)) {
    const n = Math.max(before.length, after.length)
    for (let i = 0; i < n; i++) {
      const p = joinIndex(path, i)
      if (i >= before.length) out.push({ path: p, kind: 'added', after: after[i] })
      else if (i >= after.length) out.push({ path: p, kind: 'removed', before: before[i] })
      else walk(before[i], after[i], p, out)
    }
    return
  }

  if (isObject(before) && isObject(after)) {
    for (const key of Object.keys(before)) {
      const p = joinKey(path, key)
      if (!(key in after)) out.push({ path: p, kind: 'removed', before: before[key] })
      else walk(before[key], after[key], p, out)
    }
    for (const key of Object.keys(after)) {
      if (!(key in before)) out.push({ path: joinKey(path, key), kind: 'added', after: after[key] })
    }
    return
  }

  if (before === after) return
  // Same-looking scalars of another type (1 vs "1") are a change too.
  out.push({ path, kind: 'changed', before, after })
}

// Changes from `before` to `after`, in the order of the keys of `before`,
// then the keys only `after` has. Arrays are compared by index.
export const diffPayload = (before: unknown, after: unknown): PayloadChange[] => {
  const out: PayloadChange[] = []
  walk(before, after, '', out)
  return out
}

// A path a listener reads (`e.order.status`) lost its value: the page likely
// has nothing to show.
export const lostValuePaths = (changes: PayloadChange[]): string[] =>
  changes
    .filter((c) => c.path && (c.kind === 'removed' || (c.kind === 'changed' && c.after === null)))
    .map((c) => c.path)
