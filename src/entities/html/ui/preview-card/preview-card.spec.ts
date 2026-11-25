import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { PAGE_FRAME_SANDBOX } from '@/shared/ui/email-html-frame'
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
  it('shows the page itself, with no title bar around it', async () => {
    const w = await mountCard(htmlReportMock)
    expect(w.find('[data-test="html-card"] iframe').exists()).toBe(true)
    expect(w.text()).not.toContain('Nightly report')
  })

  it('runs the page scripts in the sandbox and fits its height', async () => {
    const frame = (await mountCard(htmlReportMock)).find('iframe')
    expect(frame.attributes('sandbox')).toBe(PAGE_FRAME_SANDBOX)
    expect(frame.attributes('srcdoc')).toContain('<h1')
    expect(frame.attributes('scrolling')).toBe('no')
  })

  it('links the text to the event when the feed left the markup out', async () => {
    const w = await mountCard(htmlTruncatedMock)
    expect(w.find('iframe').exists()).toBe(false)
    expect(w.findComponent(RouterLinkStub).props('to')).toBe(`/html/${htmlTruncatedMock.uuid}`)
    expect(w.find('.html-card__text').text()).toContain('Coverage report')
    expect(w.find('[data-test="html-card-truncated"]').exists()).toBe(true)
  })
})
