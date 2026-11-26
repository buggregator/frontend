import { describe, expect, it } from 'vitest'
import type { MockCondition } from '../types'
import {
  MAX_CONDITIONS,
  conditionsCountText,
  conditionText,
  emptyCondition,
  needsValue,
  validateConditions,
} from './mock-conditions'

const header = (over: Partial<MockCondition> = {}): MockCondition => ({
  in: 'header',
  name: 'Authorization',
  op: 'equals',
  value: 'Bearer good',
  ...over,
})

describe('needsValue', () => {
  it('asks a value only for comparisons', () => {
    expect(needsValue('equals')).toBe(true)
    expect(needsValue('not_equals')).toBe(true)
    expect(needsValue('exists')).toBe(false)
    expect(needsValue('not_exists')).toBe(false)
  })
})

describe('emptyCondition', () => {
  it('starts as a header equality', () => {
    expect(emptyCondition()).toEqual({ in: 'header', name: '', op: 'equals', value: '' })
  })
})

describe('validateConditions', () => {
  it('passes valid header and body conditions', () => {
    expect(
      validateConditions([
        header(),
        { in: 'body', name: 'card.token', op: 'not_equals', value: 'tok_ok' },
        { in: 'body', name: '$.items[0].sku', op: 'exists' },
        { in: 'body', name: 'items.*.sku', op: 'equals', value: '' },
      ]),
    ).toEqual({})
  })

  it('keys each error by the condition index', () => {
    const errors = validateConditions([header(), header({ name: '  ' }), header({ name: 'X Bad:' })])
    expect(errors).toEqual({
      'conditions.1': 'Name is required.',
      'conditions.2': 'Header names cannot contain spaces or “:”.',
    })
  })

  it('rejects a broken body path', () => {
    expect(validateConditions([{ in: 'body', name: 'card..token', op: 'exists' }])).toEqual({
      'conditions.0': 'Use a field path like card.token, items.0.id or items.*.id.',
    })
    expect(validateConditions([{ in: 'body', name: '$', op: 'exists' }])['conditions.0']).toBeDefined()
  })

  it('limits the value to 4 KB, except where no value is used', () => {
    const big = 'x'.repeat(4097)
    expect(validateConditions([header({ value: big })])['conditions.0']).toBe('Value must be at most 4 KB.')
    expect(validateConditions([header({ op: 'exists', value: big })])).toEqual({})
  })

  it('allows at most 20 conditions', () => {
    const list = Array.from({ length: MAX_CONDITIONS + 1 }, () => header())
    expect(validateConditions(list)).toEqual({ conditions: 'A rule can have at most 20 conditions.' })
  })
})

describe('conditionText', () => {
  it('reads like the rule', () => {
    expect(conditionText(header())).toBe('header Authorization = Bearer good')
    expect(conditionText({ in: 'body', name: 'card.token', op: 'not_equals', value: 'x' })).toBe(
      'body card.token ≠ x',
    )
    expect(conditionText({ in: 'body', name: 'id', op: 'not_exists', value: 'stale' })).toBe(
      'body id is missing',
    )
  })
})

describe('conditionsCountText', () => {
  it('counts conditions', () => {
    expect(conditionsCountText(0)).toBe('')
    expect(conditionsCountText(1)).toBe('+1 condition')
    expect(conditionsCountText(3)).toBe('+3 conditions')
  })
})
