import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { MockRule } from '../../types'
import MockRuleRow from './mock-rule-row.vue'

const rule = (over: Partial<MockRule> = {}): MockRule => ({
  id: 'a', project: '', name: 'Pay', method: 'POST', path: '/payments', status: 200, headers: {}, body: '',
  delay_ms: 0, enabled: true, position: 0, source: 'api', read_only: false, ...over,
})

describe('MockRuleRow', () => {
  it('tags a rule with conditions and lists them on hover', () => {
    const w = mount(MockRuleRow, {
      props: {
        order: 1,
        rule: rule({
          conditions: [
            { in: 'body', name: 'card.token', op: 'equals', value: 'tok_ok' },
            { in: 'header', name: 'X-Key', op: 'exists' },
          ],
        }),
      },
    })
    const tag = w.find('.mock-rule-row__tag--conditions')
    expect(tag.text()).toBe('+2 conditions')
    expect(tag.attributes('title')).toBe('body card.token = tok_ok\nheader X-Key is present')
  })

  it('has no tag without conditions', () => {
    expect(mount(MockRuleRow, { props: { order: 1, rule: rule() } }).find('.mock-rule-row__tag--conditions').exists()).toBe(false)
  })
})
