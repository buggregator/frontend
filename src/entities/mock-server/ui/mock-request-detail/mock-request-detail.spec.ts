import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { MockRequestEvent, MockRule } from '../../types'
import MockRequestDetail from './mock-request-detail.vue'

const rule = (id: string, method: MockRule['method'], enabled = true): MockRule => ({
  id, project: '', name: '', method, path: '/users/{id}', status: 200, headers: {}, body: '',
  delay_ms: 0, enabled, position: 0, source: 'api', read_only: false,
})

const event = (mock: Partial<MockRequestEvent['payload']['mock']>): MockRequestEvent => ({
  uuid: 'u1', type: 'http-dump', project: 'default', timestamp: 1,
  payload: {
    request: { method: 'DELETE', uri: 'mock/users/7', headers: { Accept: ['*/*'] }, body: '', query: {} },
    mock: {
      matched: false, rule_id: null, rule_name: null, status: 404, headers: {}, body: '{"error":"x"}',
      body_size: 13, body_truncated: false, delay_ms: 0, near: [], ...mock,
    },
  },
})

const mountDetail = (e: MockRequestEvent, rules: MockRule[]) =>
  mount(MockRequestDetail, {
    props: { event: e, rules, origin: 'http://h' },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })

describe('MockRequestDetail', () => {
  it('explains why no rule matched and offers a prefilled rule', async () => {
    const rules = [rule('a', 'GET'), rule('b', 'DELETE', false)]
    const w = mountDetail(
      event({ near: [{ rule_id: 'a', rule_name: '', reason: 'method' }, { rule_id: 'b', rule_name: '', reason: 'disabled' }] }),
      rules
    )

    const near = w.findAll('.mock-request-detail__near li').map((li) => li.text())
    expect(near[0]).toContain('the method differs')
    expect(near[1]).toContain('the rule is disabled')

    await w.find('.mock-request-detail__btn--primary').trigger('click')
    const [draft, from] = w.emitted('create-rule')![0] as [{ method: string; path: string }, string]
    expect(draft).toMatchObject({ method: 'DELETE', path: '/users/{id}' })
    expect(from).toBe('DELETE /mock/users/7')
  })

  it('names the rule that answered and its place in the match order', () => {
    const rules = [rule('a', 'GET'), rule('b', 'DELETE')]
    const w = mountDetail(event({ matched: true, rule_id: 'b', status: 204 }), rules)
    expect(w.find('.mock-request-detail__answer').text()).toContain('#2')
  })

  it('says when the answering rule was deleted since', () => {
    const w = mountDetail(event({ matched: true, rule_id: 'gone', rule_name: 'old' }), [])
    expect(w.find('.mock-request-detail__answer').text()).toContain('deleted since')
  })

  it('shows the template error of a matched rule that failed', () => {
    const w = mountDetail(
      event({ matched: true, rule_id: 'a', rule_name: 'users', status: 500, template_error: 'mock template: body:1: map has no entry for key "id"' }),
      [rule('a', 'DELETE')]
    )
    const alert = w.find('.mock-request-detail__template-error')

    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toContain('map has no entry for key "id"')
  })

  it('shows no template error when the answer rendered', () => {
    const w = mountDetail(event({ matched: true, rule_id: 'a', status: 200 }), [rule('a', 'DELETE')])
    expect(w.find('.mock-request-detail__template-error').exists()).toBe(false)
  })

  // A matched request that rendered fine is not a «No rule matched».
  it('shows no no-match callout for a matched request', () => {
    const w = mountDetail(event({ matched: true, rule_id: 'a', status: 200 }), [rule('a', 'DELETE')])
    expect(w.find('.mock-request-detail__callout').exists()).toBe(false)
    expect(w.find('.mock-request-detail__template-error').exists()).toBe(false)
  })
})

