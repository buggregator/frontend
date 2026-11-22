import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { useHttpDump } from '../../lib'
import { httpDumpMock, httpDumpProxyJsonMock } from '../../mocks'
import HttpDumpPage from './http-dump-page.vue'

const { normalizeHttpDumpEvent } = useHttpDump()
const stubs = { HttpRequestPanel: true, HttpResponsePanel: true, HttpDumpHeader: true, CodeSnippet: true }

describe('HttpDumpPage: tabs (#6737 A)', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('Request and Raw as a tablist; a proxied request opens on Response', () => {
    const plain = mount(HttpDumpPage, { props: { event: normalizeHttpDumpEvent(httpDumpMock as never), useUrlFragment: false }, global: { stubs } })
    expect(plain.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Request', 'Raw'])
    expect(plain.find('http-request-panel-stub').exists()).toBe(true)

    const proxied = mount(HttpDumpPage, { props: { event: normalizeHttpDumpEvent(httpDumpProxyJsonMock as never), useUrlFragment: false }, global: { stubs } })
    expect(proxied.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Response', 'Request', 'Raw'])
    expect(proxied.find('http-response-panel-stub').exists()).toBe(true)
  })

  it('keeps the tab in the URL fragment, as before', async () => {
    window.history.replaceState(null, '', '/http-dump/1#raw')
    const w = mount(HttpDumpPage, { props: { event: normalizeHttpDumpEvent(httpDumpMock as never) }, global: { stubs } })
    expect(w.get('[aria-selected="true"]').text()).toBe('Raw')
    await w.findAll('[role="tab"]')[0].trigger('click')
    expect(window.location.hash).toBe('#request')
  })

  it('keeps every panel mounted: a tab switch hides, not rebuilds', async () => {
    const w = mount(HttpDumpPage, { props: { event: normalizeHttpDumpEvent(httpDumpMock as never), useUrlFragment: false }, global: { stubs }, attachTo: document.body })
    const panel = w.get('http-request-panel-stub').element
    await w.findAll('[role="tab"]')[1].trigger('click')
    expect(w.get('http-request-panel-stub').isVisible()).toBe(false)
    await w.findAll('[role="tab"]')[0].trigger('click')
    expect(w.get('http-request-panel-stub').element).toBe(panel)
    expect(w.get('http-request-panel-stub').isVisible()).toBe(true)
    w.unmount()
  })
})
