import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsCodeGraph from './settings-code-graph.vue'

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

describe('SettingsCodeGraph', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('says how to turn it on when the server has no roots', async () => {
    fetchMock.mockReturnValue(reply({ enabled: false, snippets: false, roots: [] }))
    const wrapper = mount(SettingsCodeGraph)
    await flushPromises()
    const off = wrapper.get('[data-test="code-graph-off"]')
    expect(off.text()).toContain('code_graph:')
    expect(off.text()).toContain('-v $PWD:/code:ro -e CODE_GRAPH_ROOTS=/code')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('lists folders with their state and a mount line for a missing one', async () => {
    fetchMock.mockReturnValue(
      reply({
        enabled: true,
        snippets: true,
        roots: [
          { name: 'shop-web', path: '/code/shop-web', state: 'ready', files: 418, symbols: 6912, duration_ms: 1900 },
          { name: 'payments', path: '/code/payments', state: 'error', error: 'read /code/payments: no such file or directory' }
        ]
      })
    )
    const wrapper = mount(SettingsCodeGraph)
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('418 files · 6,912 symbols')
    expect(rows[0].get('[data-test="code-root-state"]').text()).toBe('✓ Indexed · took 1.9 s')
    expect(rows[1].text()).toContain('-v ./payments:/code/payments:ro')
    expect(rows[1].get('button').text()).toBe('Try again')
    expect(wrapper.get('[data-test="code-graph-snippets"]').text()).toContain('On')
    wrapper.unmount()
  })

  it('shows a progress bar while indexing and reindexes on click', async () => {
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply({ name: 'app', path: '/code', state: 'indexing' })
        : reply({ enabled: true, snippets: false, roots: [{ name: 'app', path: '/code', state: 'ready', files: 3 }] })
    )
    const wrapper = mount(SettingsCodeGraph)
    await flushPromises()
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)

    await wrapper.get('[data-test="code-root-reindex"]').trigger('click')
    await flushPromises()
    expect(fetchMock.mock.calls.some(([u, i]) => String(u).endsWith('/api/code/roots/app/reindex') && i?.method === 'POST')).toBe(true)
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="code-root-reindex"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('shows the load error with a retry', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('offline')))
    const wrapper = mount(SettingsCodeGraph)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('offline')
  })
})
