import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { SETUP_SECTION_IDS } from './sections'
import SetupGuide from './setup-guide.vue'
import SetupHelpButton from './setup-help-button.vue'
import content from './setup-help.json'
import { useSetupHost, useSetupStack } from './use-setup-prefs'

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

const render = (sectionId = 'smtp', variant: 'page' | 'panel' = 'page') =>
  mount(SetupGuide, { props: { sectionId, sectionTitle: sectionId.toUpperCase(), variant }, attachTo: document.body })

describe('SetupGuide', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
    useSetupHost().resetHost()
    useSetupStack().setStack('')
    const events = useEventsStore()
    events.projects.available = [{ key: 'iris-app', name: 'Iris', is_default: true }]
    events.projects.activeKey = 'iris-app'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('knows every section of the content file', () => {
    expect(content.sections.map((s) => s.id)).toEqual([...SETUP_SECTION_IDS])
  })

  it('a section without a docs page (Crons) has no docs link', () => {
    const wrapper = render('crons')
    expect(wrapper.find('.setup-guide__docs').exists()).toBe(false)
    expect(wrapper.find('.setup-guide__footer').exists()).toBe(false)
    expect(render('smtp').find('.setup-guide__docs').exists()).toBe(true)
  })

  it('Queues links to its docs page', () => {
    expect(render('queues').get('.setup-guide__docs').attributes('href')).toBe(
      'https://docs.buggregator.dev/config/queues.html'
    )
  })

  it('the content has no masked «…» where a value belongs (Copy would paste it)', () => {
    const codes = content.sections.flatMap((s) => s.stacks.map((st) => st.code))
    expect(codes.filter((code) => code.includes('…'))).toEqual([])
  })

  it('fills host, the server port and the project into the code, marked', () => {
    useSettingsStore().ports = { http: 8000, smtp: 2525 }
    const wrapper = render('smtp')
    const code = wrapper.get('[data-test="setup-code"]')

    expect(code.text()).toContain('2525')
    expect(code.text()).not.toContain('{smtp_port}')
    expect(code.findAll('.setup-code__fill').map((f) => f.text())).toContain('2525')
    expect(wrapper.find('[data-test="setup-ports-unknown"]').exists()).toBe(false)
  })

  it('an older server without ports: the defaults with the amber hint', () => {
    const wrapper = render('smtp')

    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('1025')
    expect(wrapper.get('[data-test="setup-ports-unknown"]').text()).toContain('(1025)')
  })

  it('Xdebug proxy off (ports sent, no xdebug key): says it is off, not «could not read»', () => {
    useSettingsStore().ports = { http: 8000, smtp: 1025 }
    const wrapper = render('xdebug')

    expect(wrapper.find('[data-test="setup-ports-unknown"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="setup-port-off"]').text()).toBe(
      'The Xdebug proxy is off on this server; 9003 is its default port.'
    )
  })

  it('Sentry › OpenTelemetry SDK: its own steps, the project filled into the env and the hint', async () => {
    useSettingsStore().ports = { http: 8000 }
    useSetupStack().setStack('otel-sdk')
    const wrapper = render('sentry')
    await flushPromises()

    const code = wrapper.get('[data-test="setup-code"]').text()
    expect(code).toContain('OTEL_EXPORTER_OTLP_HEADERS=X-Buggregator-Project=iris-app')
    expect(code).not.toContain('{http_port}')
    const steps = wrapper.get('.setup-guide__steps').text()
    expect(steps).toContain('/v1/traces')
    expect(steps).not.toContain('Install the Sentry SDK')
    expect(wrapper.get('.setup-guide__stack-hint').text()).toContain('/api/iris-app/integration/otlp/v1/traces')
  })

  it('Sentry › OTel Collector: an otlp_http exporter with the header; SDK tabs keep the section steps', async () => {
    useSetupStack().setStack('otel-collector')
    const wrapper = render('sentry')
    await flushPromises()

    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('otlp_http/buggregator')
    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('X-Buggregator-Project: iris-app')

    useSetupStack().setStack('laravel')
    await flushPromises()
    expect(wrapper.get('.setup-guide__steps').text()).toContain('Install the Sentry SDK')
  })

  const atPage = (href: string) => {
    const url = new URL(href)
    vi.stubGlobal('location', { ...window.location, href, protocol: url.protocol, hostname: url.hostname, port: url.port })
  }

  it('behind a reverse proxy (no port in the address): the scheme port, not the listen port', () => {
    atPage('http://bugs.example.test/')
    useSettingsStore().ports = { http: 8000 }
    const wrapper = render('sentry')
    const fills = wrapper.get('[data-test="setup-code"]').findAll('.setup-code__fill').map((f) => f.text())

    expect(fills).toContain('80')
    expect(fills).not.toContain('8000')
    expect(wrapper.find('[data-test="setup-https-note"]').exists()).toBe(false)
  })

  it('on https: port 443 and a line to use https:// in the samples', () => {
    atPage('https://bugs.example.test/')
    useSettingsStore().ports = { http: 8000 }
    const wrapper = render('sentry')

    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('bugs.example.test:443')
    expect(wrapper.get('[data-test="setup-https-note"]').text()).toContain('https://')
  })

  it('Sentry › JavaScript: the project key with _ for -', async () => {
    useSetupStack().setStack('javascript')
    const wrapper = render('sentry')

    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('http://iris_app@')
  })

  it('stack tabs: arrows move and select, the choice is one for every section', async () => {
    const wrapper = render('smtp')
    const tabs = () => wrapper.findAll('[role="tab"]')

    expect(tabs()[0].attributes('aria-selected')).toBe('true')
    expect(tabs()[1].attributes('tabindex')).toBe('-1')
    await tabs()[0].trigger('keydown', { key: 'ArrowRight' })
    expect(tabs()[1].attributes('aria-selected')).toBe('true')
    expect(localStorage.getItem('setup_stack')).toBe('symfony')
    await tabs()[1].trigger('keydown', { key: 'End' })
    expect(tabs()[tabs().length - 1].attributes('aria-selected')).toBe('true')

    // Sentry has Symfony too; Ray has no Spring Boot → its first stack.
    useSetupStack().setStack('symfony')
    expect(render('sentry').get('[role="tab"][aria-selected="true"]').text()).toBe('Symfony')
    useSetupStack().setStack('spring-boot')
    expect(render('ray').get('[role="tab"][aria-selected="true"]').text()).toBe('Laravel')
  })

  it('«Change» sets the host for the code and remembers it; Esc cancels', async () => {
    const wrapper = render('smtp')
    await wrapper.get('.setup-guide__link-btn').trigger('click')
    await wrapper.get('input[aria-label="Host"]').setValue('buggregator')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[data-test="setup-code"]').text()).toContain('MAIL_HOST=buggregator')
    expect(localStorage.getItem('setup_host')).toBe('buggregator')

    await wrapper.get('.setup-guide__link-btn').trigger('click')
    await wrapper.get('input[aria-label="Host"]').setValue('other')
    await wrapper.get('form').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('input[aria-label="Host"]').exists()).toBe(false)
    expect(localStorage.getItem('setup_host')).toBe('buggregator')
  })

  it('the panel variant has no hero and no status line', () => {
    const wrapper = render('smtp', 'panel')
    expect(wrapper.find('.setup-guide__hero').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('Copy copies the filled text and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    useSettingsStore().ports = { http: 8000, smtp: 2525 }
    const wrapper = render('smtp')

    await wrapper.get('[data-test="setup-copy"]').trigger('click')
    await flushPromises()
    expect(writeText.mock.calls[0][0]).toContain('2525')
    expect(writeText.mock.calls[0][0]).not.toContain('{')
    expect(wrapper.get('[data-test="setup-copy"]').text()).toBe('Copied')
  })

  it('Copy refused: says so and tells how to copy by hand', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } })
    const wrapper = render('smtp')

    await wrapper.get('[data-test="setup-copy"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-test="setup-copy"]').text()).toBe('Copy failed')
    expect(wrapper.text()).toContain('press Ctrl+C')
  })
})

describe('SetupHelpButton', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('opens the panel as a dialog; Esc closes it and focus returns to the button', async () => {
    const wrapper = mount(SetupHelpButton, { props: { sectionId: 'smtp', sectionTitle: 'SMTP' }, attachTo: document.body })
    const button = wrapper.get('[data-test="setup-help-button"]')

    expect(button.attributes('aria-label')).toBe('How to set up')
    expect(button.attributes('title')).toBe('How to set up')
    ;(button.element as HTMLElement).focus()
    await button.trigger('click')
    await vi.dynamicImportSettled()
    await flushPromises()

    const dialog = document.querySelector('[data-test="setup-panel"]') as HTMLElement
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(document.getElementById(dialog.getAttribute('aria-labelledby') ?? '')?.textContent?.trim()).toBe('How to set up SMTP')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement?.getAttribute('role')).toBe('tab')

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.querySelector('[data-test="setup-panel"]')).toBeNull()
    expect(document.activeElement).toBe(button.element)
  })
})
