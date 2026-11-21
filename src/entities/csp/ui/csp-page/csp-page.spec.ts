import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { NormalizedEvent } from '@/shared/types'
import type { CspPayload, CspReport } from '../../types'
import CspPage from './csp-page.vue'

const event = (reports: CspReport[], format = 'csp-report') =>
  ({
    id: '1', type: 'csp', serverName: '', origin: null, labels: [],
    date: new Date(2026, 10, 21, 10, 5, 7),
    payload: { format, reports }
  }) as unknown as NormalizedEvent<CspPayload>

const violation: CspReport = {
  type: 'csp-violation', url: 'https://shop.test/cart', directive: 'script-src-elem',
  blocked: 'https://evil.test/x.js', disposition: 'enforce', policy: "script-src 'self'"
}

const mountPage = (reports: CspReport[], format?: string) =>
  mount(CspPage, { props: { event: event(reports, format) } })

describe('CspPage', () => {
  it('uses the shared header with the format and date', () => {
    const w = mountPage([violation], 'reports+json')
    expect(w.find('.event-detail__title').text()).toBe('Browser report')
    expect(w.find('[data-test="event-detail-subtitle"]').text()).toBe('Reporting API')
    expect(w.find('span.event-detail__date').text()).toBe('21.11.2026 10:05:07')
  })

  it('counts several reports in the title', () => {
    const w = mountPage([violation, { ...violation, disposition: 'report' }])
    expect(w.find('.event-detail__title').text()).toBe('2 browser reports')
    expect(w.find('[data-test="event-detail-subtitle"]').text()).toBe('report-uri (csp-report)')
    expect(w.findAll('[data-test="csp-report"]')).toHaveLength(2)
  })

  it('shows the fields as table rows, with copy on directive and blocked URI', () => {
    const w = mountPage([violation])
    const rows = w.findAll('.table-row')
    expect(rows.map((r) => r.find('.table-row__name').text())).toEqual(['Page', 'Directive', 'Blocked'])
    expect(rows.map((r) => r.find('.table-row__copy').exists())).toEqual([false, true, true])
    expect(w.find('a[href="https://shop.test/cart"]').attributes('rel')).toBe('noopener noreferrer')
  })

  it('shows the policy and the raw report in code snippets', () => {
    const w = mountPage([{ ...violation, body: { documentURL: 'https://shop.test/cart' } }])
    const snippets = w.findAll('.code-snippet')
    expect(snippets).toHaveLength(2)
    expect(snippets[0].text()).toContain("script-src 'self'")
    expect(snippets[1].text()).toContain('documentURL')
    expect(w.find('pre.csp-report__pre').exists()).toBe(false)
  })

  it('has no policy block without a policy', () => {
    const w = mountPage([{ type: 'deprecation', message: 'Old API' }])
    expect(w.findAll('.code-snippet')).toHaveLength(1)
  })
})
