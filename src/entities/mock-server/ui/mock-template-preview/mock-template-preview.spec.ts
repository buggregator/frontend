import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyDraft } from '../../lib/mock-rule'
import MockTemplatePreview from './mock-template-preview.vue'

const answer = (body: unknown, status = 200) => vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })))

describe('MockTemplatePreview', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  const run = async (fetchMock: ReturnType<typeof answer>) => {
    vi.stubGlobal('fetch', fetchMock)
    const w = mount(MockTemplatePreview, { props: { rule: { ...emptyDraft(), path: '/users/{id}', template: true } } })
    expect(w.find<HTMLInputElement>('[aria-label="Sample request path with query"]').element.value).toBe('/users/42')
    await w.find('.mock-preview__run').trigger('click')
    await flushPromises()
    return w
  }

  it('shows the rendered status, headers and body', async () => {
    const w = await run(answer({ status: 201, headers: { 'X-Id': '42' }, body: '{"id":42}', matched: true, error: null }))
    expect(w.text()).toContain('201')
    expect(w.find('.mock-preview__headers').text()).toContain('X-Id')
    expect(w.find('.mock-preview__body').text()).toBe('{\n  "id": 42\n}')
    expect(w.find('.mock-preview__warn').exists()).toBe(false)
  })

  it('shows a runtime template error and warns when the request would not match', async () => {
    const w = await run(answer({ status: 500, headers: {}, body: '', matched: false, error: 'mock template: boom' }))
    expect(w.find('.mock-preview__error').text()).toContain('mock template: boom')
    expect(w.find('.mock-preview__warn').exists()).toBe(true)
  })

  it('shows the parse error of a rejected template', async () => {
    const w = await run(answer({ message: 'validation failed', errors: { body: 'template: body:1: unexpected EOF' } }, 422))
    expect(w.find('.mock-preview__error').text()).toContain('unexpected EOF')
    // one live region announces it; a role=alert inside would say it twice
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('marks the sample path when the server rejects it', async () => {
    const w = await run(answer({ message: 'validation failed', errors: { 'request.path': 'must start with /' } }, 422))
    const path = w.find('[aria-label="Sample request path with query"]')
    expect(path.attributes('aria-invalid')).toBe('true')
    expect(path.classes()).toContain('mock-preview__input--error')
    expect(w.find('#mock-preview-problem').text()).toContain('Sample path must start with /')
  })
})
