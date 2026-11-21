import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { CODE_LOCATION_LINK } from '@/shared/lib/code-location-link'
import SentryExceptionFrame from './sentry-exception-frame.vue'

const frame = {
  filename: '/app/src/Cart.php',
  function: 'total',
  lineno: 12,
  pre_context: ['$a = 1;'],
  context_line: 'return $a;',
  post_context: ['}'],
}

// Audit 5.10: a frame opened only by a click on a div.
describe('SentryExceptionFrame: keyboard', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  it('opens and closes the code with a button that says its state', async () => {
    const wrapper = mount(SentryExceptionFrame, { props: { frame, isOpen: false } as never })
    const toggle = wrapper.get('button.frame__toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Show code of Cart.php at line 12')
    expect(wrapper.find('.frame__body').exists()).toBe(false)

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.frame__body').exists()).toBe(true)
    expect(toggle.attributes('aria-controls')).toBe(wrapper.get('.frame__body').attributes('id'))

    await toggle.trigger('click')
    expect(wrapper.find('.frame__body').exists()).toBe(false)
  })

  it('has no toggle when there is no code to show', () => {
    const wrapper = mount(SentryExceptionFrame, { props: { frame: { filename: 'a.php', lineno: 1 }, isOpen: false } as never })
    expect(wrapper.find('button.frame__toggle').exists()).toBe(false)
  })
})

// #6573 A: the app provides the «Graph» link; the frame passes where it is.
describe('SentryExceptionFrame: code graph link', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  const Probe = defineComponent({
    props: { file: { type: String, default: '' }, line: { type: Number, default: 0 }, origin: { type: String, default: '' }, label: { type: String, default: '' } },
    setup: (p) => () => h('a', { 'data-test': 'probe' }, `${p.label} ${p.file}:${p.line} ${p.origin}`)
  })

  it('renders the provided link with the absolute path, the line and the exception type', () => {
    const wrapper = mount(SentryExceptionFrame, {
      props: { frame: { ...frame, abs_path: '/var/www/html/src/Cart.php' }, isOpen: false, origin: 'CartException' } as never,
      global: { provide: { [CODE_LOCATION_LINK as symbol]: Probe } }
    })
    expect(wrapper.get('[data-test="probe"]').text()).toBe('Graph /var/www/html/src/Cart.php:12 CartException')
  })

  it('a click on the link does not fold the frame', async () => {
    const wrapper = mount(SentryExceptionFrame, {
      props: { frame, isOpen: true } as never,
      global: { provide: { [CODE_LOCATION_LINK as symbol]: Probe } }
    })
    await wrapper.get('[data-test="probe"]').trigger('click')
    expect(wrapper.find('.frame__body').exists()).toBe(true)
  })

  it('shows nothing without a provider', () => {
    const wrapper = mount(SentryExceptionFrame, { props: { frame, isOpen: false } as never })
    expect(wrapper.find('[data-test="probe"]').exists()).toBe(false)
  })
})
