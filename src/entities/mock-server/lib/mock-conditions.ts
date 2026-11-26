import type { MockCondition, MockConditionIn, MockConditionOp, MockRuleErrors } from '../types'

// Mirrors the server's checks (modules/httpdumps/mock_conditions.go), so the
// form can show the error before a round trip; the server's 422 still wins.
export const MAX_CONDITIONS = 20
export const MAX_CONDITION_VALUE_BYTES = 4096
const MAX_CONDITION_NAME_BYTES = 512

export const CONDITION_PLACES: { value: MockConditionIn; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'body', label: 'Body field' },
]

export const CONDITION_OPS: { value: MockConditionOp; label: string; sign: string }[] = [
  { value: 'equals', label: 'equals', sign: '=' },
  { value: 'not_equals', label: 'does not equal', sign: '≠' },
  { value: 'exists', label: 'is present', sign: 'is present' },
  { value: 'not_exists', label: 'is missing', sign: 'is missing' },
]

export const needsValue = (op: MockConditionOp): boolean => op === 'equals' || op === 'not_equals'

export const emptyCondition = (): MockCondition => ({ in: 'header', name: '', op: 'equals', value: '' })

const bytes = (s: string) => new TextEncoder().encode(s).length

// "$.items[0].id", "items[0].id" and "items.0.id" are the same path; every
// key must be non-empty.
const isBodyPath = (name: string): boolean => {
  const s = name.replace(/^\$/, '').replace(/^\./, '').replace(/\[/g, '.').replace(/\]/g, '')
  return s !== '' && s.split('.').every((k) => k !== '')
}

const conditionError = (c: MockCondition): string | undefined => {
  const name = c.name.trim()
  if (!name) return 'Name is required.'
  if (bytes(name) > MAX_CONDITION_NAME_BYTES) return 'Name must be at most 512 bytes.'
  if (c.in === 'header' && /[\s:]/.test(name)) return 'Header names cannot contain spaces or “:”.'
  if (c.in === 'body' && !isBodyPath(name)) return 'Use a field path like card.token, items.0.id or items.*.id.'
  if (needsValue(c.op) && bytes(c.value ?? '') > MAX_CONDITION_VALUE_BYTES) return 'Value must be at most 4 KB.'
  return undefined
}

export const validateConditions = (list: MockCondition[]): MockRuleErrors => {
  if (list.length > MAX_CONDITIONS) return { conditions: `A rule can have at most ${MAX_CONDITIONS} conditions.` }

  const errors: MockRuleErrors = {}
  list.forEach((c, i) => {
    const error = conditionError(c)
    if (error) errors[`conditions.${i}`] = error
  })
  return errors
}

// What the server stores: no value for exists / not_exists, names trimmed.
export const cleanConditions = (list: MockCondition[]): MockCondition[] =>
  list.map((c) => {
    const clean: MockCondition = { in: c.in, name: c.name.trim(), op: c.op }
    if (needsValue(c.op)) clean.value = c.value ?? ''
    return clean
  })

// "header Authorization = Bearer good", for tooltips and lists.
export const conditionText = (c: MockCondition): string => {
  const op = CONDITION_OPS.find((o) => o.value === c.op)
  const sign = op?.sign ?? c.op
  return needsValue(c.op) ? `${c.in} ${c.name} ${sign} ${c.value ?? ''}` : `${c.in} ${c.name} ${sign}`
}

export const conditionsCountText = (n: number): string =>
  n ? `+${n} ${n === 1 ? 'condition' : 'conditions'}` : ''
