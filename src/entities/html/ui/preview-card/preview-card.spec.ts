import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { EMAIL_FRAME_SANDBOX } from '@/shared/ui/email-html-frame'
import { normalizeHtmlEvent } from '../../lib'
import { htmlReportMock, htmlTruncatedMock } from '../../mocks'
import PreviewCard from './preview-card.vue'

const mountCard = async (mock: Parameters<typeof normalizeHtmlEvent>[0]) => {
  const w = mount(PreviewCard, {
    props: { event: normalizeHtmlEvent(mock) },
    global: { stubs: { RouterLink: RouterLinkStub, PreviewCard: { template: '<div><slot /></div>' } } }
  })
  await flushPromises()
  return w
}

describe('html PreviewCard', () => {
  it('links to the event and shows the title and size', async () => {
    const w = await mountCard(htmlReportMock)
    expect(w.findComponent(RouterLinkStub).props('to')).toBe(`/html/${htmlReportMock.uuid}`)
    expect(w.find('.html-card__title').text()).toBe('Nightly report')
    expect(w.find('.html-card__size').text()).toMatch(/b$/i)
  })

  it('draws the markup in the sandboxed frame that takes no focus', async () => {
    const frame = (await mountCard(htmlReportMock)).find('iframe')
    expect(frame.attributes('sandbox')).toBe(EMAIL_FRAME_SANDBOX)
    expect(frame.attributes('sandbox')).not.toContain('allow-scripts')
    expect(frame.attributes('srcdoc')).toContain('<h1')
    expect(frame.attributes('tabindex')).toBe('-1')
  })

  it('shows the text and a note when the markup was too big for the feed', async () => {
    const w = await mountCard(htmlTruncatedMock)
    expect(w.find('iframe').exists()).toBe(false)
    expect(w.find('.html-card__title').text()).toBe('HTML page')
    expect(w.find('.html-card__text').text()).toContain('Coverage report')
    expect(w.find('[data-test="html-card-truncated"]').exists()).toBe(true)
  })

  it('leaves a page over 32 KB to the event page', async () => {
    const w = await mountCard({ ...htmlReportMock, payload: { title: 'Coverage', html: '<p>x</p>'.repeat(5000), size: 40000 } })
    expect(w.find('iframe').exists()).toBe(false)
    expect(w.find('[data-test="html-card-truncated"]').exists()).toBe(true)
  })
})
