import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockHelpersCache } from '../../lib/use-mock-template'
import MockTemplateHelpers from './mock-template-helpers.vue'

const fakes = Array.from({ length: 35 }, (_, i) => ({
  name: `gen${i}`, category: i % 2 ? 'internet' : 'person', description: `Generator ${i}`,
  example: 'sample', output: 'string', params: [],
}))
fakes.push({ name: 'email', category: 'internet', description: 'Email address', example: 'a@example.com', output: 'string', params: [] })

const DATA = {
  helpers: [
    { name: 'path', group: 'request', usage: 'path "name"', description: 'Path parameter', example: '{"id": {{ path "id" }}}', result: '{"id": 42}' },
    { name: 'json', group: 'output', usage: 'json value', description: 'As JSON', example: '{{ json 1 }}', result: '1' },
  ],
  fake: fakes,
}

describe('MockTemplateHelpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetMockHelpersCache()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(DATA)))))
  })
  afterEach(() => vi.unstubAllGlobals())

  const mountHelpers = async () => {
    const w = mount(MockTemplateHelpers)
    await flushPromises()
    return w
  }

  it('lists functions by group and inserts the usage or the example', async () => {
    const w = await mountHelpers()
    expect(w.findAll('.mock-helpers__group-title').map((t) => t.text())).toEqual(['From the request', 'Output'])

    await w.find('[aria-label="Insert path"]').trigger('click')
    await w.find('[aria-label="Insert the path example"]').trigger('click')
    expect(w.emitted('insert')).toEqual([['{{ path "name" }}'], ['{"id": {{ path "id" }}}']])
  })

  it('searches fake generators, pages the list and inserts the example', async () => {
    const w = await mountHelpers()
    await w.find('#mock-helpers-tab-fake').trigger('click')
    expect(w.findAll('.mock-helpers__item')).toHaveLength(30)
    expect(w.text()).toContain('36 of 36 generators')

    await w.find('.mock-helpers__link').trigger('click') // Show 6 more
    expect(w.findAll('.mock-helpers__item')).toHaveLength(36)

    await w.find('input[type="search"]').setValue('mail')
    expect(w.findAll('.mock-helpers__item')).toHaveLength(1)

    await w.find('[aria-label="Insert fake email"]').trigger('click')
    expect(w.emitted('insert')).toEqual([['{{ fake "email" | json }}']])
  })

  it('says when no generator matches and clears the search', async () => {
    const w = await mountHelpers()
    await w.find('#mock-helpers-tab-fake').trigger('click')
    await w.find('input[type="search"]').setValue('zzz')
    expect(w.text()).toContain('No generator matches “zzz”')

    const clear = w.findAll('.mock-helpers__link').find((b) => b.text() === 'Clear search')
    await clear!.trigger('click')
    expect(w.find<HTMLInputElement>('input[type="search"]').element.value).toBe('')
    expect(w.findAll('.mock-helpers__item')).toHaveLength(30)
  })

  it('says when the list could not load', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 500 }))))
    const w = await mountHelpers()
    expect(w.text()).toContain("Couldn't load the helper list.")
  })
})
