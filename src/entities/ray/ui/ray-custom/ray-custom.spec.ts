import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { EMAIL_FRAME_SANDBOX } from '@/shared/ui/email-html-frame'
import RayCustom from './ray-custom.vue'

describe('RayCustom', () => {
  it('shows ray()->html() as a page in the sandboxed frame', () => {
    const w = mount(RayCustom, { props: { content: { label: 'HTML', content: '<b>paid</b><script>x()</script>' } } })
    const frame = w.find('[data-test="ray-html"] iframe')
    expect(frame.attributes('sandbox')).toBe(EMAIL_FRAME_SANDBOX)
    expect(frame.attributes('srcdoc')).toContain('<b>paid</b>')
    expect(w.find('.value-dump').exists()).toBe(false)
  })

  it('keeps other custom payloads as a dump', () => {
    const w = mount(RayCustom, { props: { content: { label: 'Count', content: 'Called 1 time.' } } })
    expect(w.find('iframe').exists()).toBe(false)
    expect(w.find('.value-dump').text()).toContain('Called 1 time.')
  })
})
