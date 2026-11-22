import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerEvent } from '@/shared/types'
import type { Monolog } from '../../types'
import MonologLogRow from './monolog-log-row.vue'

vi.mock('@/shared/lib/clipboard', () => ({ copyTextToClipboard: vi.fn(() => Promise.resolve()) }))

const event = (payload: Partial<Monolog> = {}): ServerEvent<Monolog> => ({
  uuid: 'u1',
  type: 'monolog',
  project: 'default',
  timestamp: 1795338814,
  payload: {
    message: 'OrderFailedException: checkout-api returned 500\nstack…',
    context: { cart_id: 8812, user_id: 42 },
    extra: { hostname: 'anna-mbp', trace_id: 'aca37ea6' },
    level: 400,
    level_name: 'ERROR',
    channel: 'app',
    datetime: '2026-11-22T13:00:00.123+00:00',
    ...payload
  }
})

const render = (props: Record<string, unknown> = {}) =>
  mount(MonologLogRow, {
    props: { event: event(), 'onUpdate:expanded': () => {}, ...props },
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' },
        MonologBody: {
          props: ['message', 'context', 'extra'],
          template: '<div class="body">{{ JSON.stringify(context) }}</div>'
        }
      }
    }
  })

describe('MonologLogRow', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows level, channel, the first line of the message and a context summary', () => {
    const wrapper = render()
    expect(wrapper.attributes('data-level')).toBe('error')
    expect(wrapper.classes()).toContain('mlog-row--error')
    expect(wrapper.get('.mlog-row__channel').text()).toBe('app')
    expect(wrapper.get('[data-test="mlog-message"]').text()).toBe(
      'OrderFailedException: checkout-api returned 500'
    )
    expect(wrapper.get('.mlog-row__summary').text()).toBe('cart_id=8812 user_id=42')
  })

  it('marks every search word in the message', () => {
    const wrapper = render({ terms: ['order', 'returned'] })
    expect(wrapper.findAll('mark').map((m) => m.text())).toEqual(['Order', 'returned'])
  })

  it('expands on click and folds on Enter', async () => {
    const wrapper = render()
    expect(wrapper.find('[data-test="mlog-details"]').exists()).toBe(false)
    await wrapper.get('.mlog-row__line').trigger('click')
    expect(wrapper.find('[data-test="mlog-details"]').exists()).toBe(true)
    await wrapper.get('[data-test="expandable-row-toggle"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:expanded')).toEqual([[true], [false]])
  })

  it('expanded: context and extra, and the same request with its links', () => {
    const wrapper = render({ expanded: true, traceCount: 9 })
    expect(wrapper.get('.body').text()).toContain('8812')
    const request = wrapper.get('[data-test="mlog-same-request"]')
    expect(request.text()).toContain('aca37ea6')
    const logs = wrapper.get('[data-test="mlog-trace-logs"]')
    expect(logs.text()).toBe('All lines of this request (9 in this time)')
    expect(JSON.parse(logs.attributes('data-to')!)).toEqual({
      name: 'logs',
      query: { trace: 'aca37ea6', window: 'all' }
    })
    expect(
      JSON.parse(wrapper.get('[data-test="mlog-sentry-trace"]').attributes('data-to')!)
    ).toEqual({
      name: 'sentry-trace-detail',
      params: { traceId: 'aca37ea6' }
    })
  })

  it('has no request block without a trace id', () => {
    const plain = render({ expanded: true, event: event({ extra: [] }) })
    expect(plain.find('[data-test="mlog-same-request"]').exists()).toBe(false)
  })

  it('copies the line', async () => {
    const wrapper = render({ expanded: true })
    await wrapper.get('[data-test="mlog-copy"]').trigger('click')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.get('[data-test="mlog-copy"]').text()).toBe('Copied')
  })
})
