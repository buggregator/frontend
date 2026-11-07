import { describe, expect, it } from 'vitest'
import type { MockRule } from '../types'
import { toInput } from './use-mock-rules'

const rule = (extra: Partial<MockRule> = {}): MockRule => ({
  id: 'r1', project: '', name: '', method: 'GET', path: '/a', status: 200, headers: {}, body: '',
  delay_ms: 0, enabled: true, position: 0, source: 'api', read_only: false, ...extra,
})

describe('toInput', () => {
  // The editor always sends template and seed: a PUT without them keeps the stored ones.
  it('carries template and seed of the rule', () => {
    expect(toInput(rule({ template: true, seed: 42 }))).toMatchObject({ template: true, seed: 42 })
  })

  it('reads a rule from an older server as plain, random seed', () => {
    const old = rule()
    delete (old as Partial<MockRule>).template
    delete (old as Partial<MockRule>).seed
    expect(toInput(old)).toMatchObject({ template: false, seed: 0 })
  })
})
