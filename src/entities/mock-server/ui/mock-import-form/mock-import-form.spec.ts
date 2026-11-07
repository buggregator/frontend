import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MockImportForm from './mock-import-form.vue'

describe('MockImportForm', () => {
  it('submits the pasted spec with the chosen project', async () => {
    const w = mount(MockImportForm, { props: { projects: ['shop'] } })
    await w.find('#mock-i-spec').setValue('openapi: 3.0.0')
    await w.find('#mock-i-project').setValue('shop')
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')?.[0]).toEqual([{ spec: 'openapi: 3.0.0', project: 'shop' }])
  })

  it('does not submit without a spec', async () => {
    const w = mount(MockImportForm)
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
  })

  it('submits a url and an own base path', async () => {
    const w = mount(MockImportForm)
    await w.findAll('.mock-import__tab')[1].trigger('click')
    await w.find('#mock-i-url').setValue('https://x/openapi.json')
    await w.find('input[type="checkbox"]').setValue(false)
    await w.find('#mock-i-base').setValue('/v2')
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')?.[0]).toEqual([{ url: 'https://x/openapi.json', base_path: '/v2' }])
  })

  it('shows a server error on the url field', async () => {
    const w = mount(MockImportForm, { props: { errors: { url: 'download: x answered 404' } } })
    await w.findAll('.mock-import__tab')[1].trigger('click')
    expect(w.find('#mock-i-url').attributes('aria-invalid')).toBe('true')
    expect(w.find('#mock-i-url-err').text()).toBe('download: x answered 404')
  })

  // A re-import replaces the group's rules: the person is told before.
  it('warns when the group exists', async () => {
    const w = mount(MockImportForm, { props: { groups: new Map([['openapi:Shop', 3]]) } })
    expect(w.find('.mock-import__warn').exists()).toBe(false)
    await w.find('#mock-i-group').setValue('openapi:Shop')
    expect(w.find('.mock-import__warn').text()).toContain('has 3 rules')
  })

  it('shows the result with the skipped operations', () => {
    const w = mount(MockImportForm, {
      props: {
        result: {
          group: 'openapi:Shop', title: 'Shop', rules: [],
          skipped: [{ method: 'GET', path: '/f/{n}.json', reason: 'path: bad parameter segment' }],
        },
      },
    })
    expect(w.find('[role="status"]').text()).toContain('0 rules')
    expect(w.find('.mock-import__skipped').text()).toContain('GET /f/{n}.json')
    expect(w.find('form').exists()).toBe(false)
  })
})
