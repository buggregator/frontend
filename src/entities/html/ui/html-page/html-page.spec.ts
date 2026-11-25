import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { EMAIL_FRAME_SANDBOX } from '@/shared/ui/email-html-frame'
import { normalizeHtmlEvent } from '../../lib'
import { htmlReportMock } from '../../mocks'
import HtmlPage from './html-page.vue'

const mountPage = () => mount(HtmlPage, { props: { event: normalizeHtmlEvent(htmlReportMock) } })

describe('HtmlPage', () => {
  it('puts the title and size in the shared header', () => {
    const w = mountPage()
    expect(w.find('.event-detail__title').text()).toBe('Nightly report')
    expect(w.find('[data-test="event-detail-subtitle"]').text()).toMatch(/b$/i)
  })

  it('has Preview and Source tabs, Preview first', () => {
    const w = mountPage()
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Preview', 'Source'])
    expect(w.find('iframe').isVisible()).toBe(true)
  })

  it('shows the page in the mail sandbox: scripts do not run', () => {
    const frame = mountPage().find('iframe')
    expect(frame.attributes('sandbox')).toBe(EMAIL_FRAME_SANDBOX)
    expect(frame.attributes('srcdoc')).toContain('Open build #42')
  })

  it('shows the markup as code on the Source tab', async () => {
    const w = mountPage()
    await w.findAll('[role="tab"]')[1].trigger('click')
    expect(w.find('iframe').isVisible()).toBe(false)
    expect(w.find('.code-snippet').text()).toContain('<h1')
  })
})
