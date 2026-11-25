import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { EMAIL_FRAME_SANDBOX, PAGE_FRAME_SANDBOX, withHead } from './constants'
import EmailHtmlFrame from './email-html-frame.vue'

const mounted: { unmount: () => void }[] = []
afterEach(() => mounted.splice(0).forEach((w) => w.unmount()))

const mountFrame = (props: Record<string, unknown>) => {
  const w = mount(EmailHtmlFrame, { props: { html: '<p>hi</p>', ...props }, attachTo: document.body })
  mounted.push(w)
  return w
}

const post = (source: Window | null, data: unknown) =>
  window.dispatchEvent(new MessageEvent('message', { data, source }))

describe('EmailHtmlFrame', () => {
  it('blocks scripts by default (mails)', () => {
    const frame = mountFrame({}).find('iframe')
    expect(frame.attributes('sandbox')).toBe(EMAIL_FRAME_SANDBOX)
    expect(frame.attributes('srcdoc')).toContain('<base target="_blank">')
  })

  it('runs the page scripts with scripts, never with the app origin', () => {
    const sandbox = mountFrame({ scripts: true }).find('iframe').attributes('sandbox') ?? ''
    expect(sandbox).toBe(PAGE_FRAME_SANDBOX)
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-same-origin')
    expect(sandbox).not.toContain('allow-top-navigation')
  })

  it('keeps the doctype first, so the page is not in quirks mode', () => {
    expect(withHead('<!DOCTYPE html><html></html>', '<base>')).toBe('<!DOCTYPE html><base><html></html>')
    expect(withHead('<p>x</p>', '<base>')).toBe('<base><p>x</p>')
  })

  it('fit: takes the height its own page reports, clamped', async () => {
    const w = mountFrame({ scripts: true, fit: true })
    const frame = w.find('iframe')
    expect(frame.attributes('srcdoc')).toContain('bgrFrameHeight')
    expect(frame.attributes('scrolling')).toBe('no')

    const own = (frame.element as HTMLIFrameElement).contentWindow
    post(own, { bgrFrameHeight: 512.2 })
    await w.vm.$nextTick()
    expect(frame.attributes('style')).toContain('height: 513px')

    post(own, { bgrFrameHeight: 1e9 })
    await w.vm.$nextTick()
    expect(frame.attributes('style')).toContain('height: 100000px')
  })

  it('fit: ignores other windows and other messages', async () => {
    const w = mountFrame({ scripts: true, fit: true })
    const frame = w.find('iframe')
    post(window, { bgrFrameHeight: 900 })
    post((frame.element as HTMLIFrameElement).contentWindow, { bgrFrameHeight: 'x' })
    await w.vm.$nextTick()
    expect(frame.attributes('style')).toContain('height: 150px')
  })
})
