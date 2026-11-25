import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { routerKey } from 'vue-router'
import MdText from './md-text.vue'

const render = async (text: string) => {
  const w = mount(MdText, { props: { text } })
  await flushPromises()
  return w
}

describe('MdText', () => {
  it('renders headings, bold, lists and inline code', async () => {
    const w = await render('## Cause\n\n**Order** is `null`:\n\n- one\n- two\n\n1. first')
    expect(w.find('h2').text()).toBe('Cause')
    expect(w.find('strong').text()).toBe('Order')
    expect(w.find('p code').text()).toBe('null')
    expect(w.findAll('ul li')).toHaveLength(2)
    expect(w.findAll('ol li')).toHaveLength(1)
  })

  it('shows fenced code in the shared CodeSnippet with its language', async () => {
    const w = await render('Fix:\n```js\nconst a = 1\n```')
    const snippet = w.findComponent({ name: 'CodeSnippet' })
    expect(snippet.exists()).toBe(true)
    expect(snippet.props('language')).toBe('js')
    expect(snippet.props('code')).toBe('const a = 1')
  })

  it('keeps raw HTML as text (no <script>, no <img onerror>)', async () => {
    const w = await render('<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">')
    expect(w.find('script').exists()).toBe(false)
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('<script>alert(1)</script>')
    expect(w.text()).toContain('<img src=x onerror="alert(2)">')
  })

  it('links only http(s), in a new tab; javascript:, data: and relative stay text', async () => {
    const w = await render(
      '[ok](https://example.com) [js](javascript:alert(1)) [d](data:text/html,x) [rel](/admin) see https://a.example/x'
    )
    const links = w.findAll('a')
    expect(links.map((a) => a.attributes('href'))).toEqual(['https://example.com', 'https://a.example/x'])
    expect(links[0].attributes('target')).toBe('_blank')
    expect(links[0].attributes('rel')).toBe('noopener noreferrer')
    expect(w.text()).toContain('[js](javascript:alert(1))')
  })

  it('never loads images: shows their alt text', async () => {
    const w = await render('![diagram](https://example.com/x.png)')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('.md-text__image').text()).toBe('[diagram]')
  })

  it('shows a link to an app page as a chip that opens in the app', async () => {
    const push = vi.fn()
    const w = mount(MdText, {
      props: { text: 'See [Order 14 not found](/sentry/event/0b7e91c2-aaaa) and [it](http://localhost:3000/profiler/abc-1).' },
      global: { mocks: { $router: { push } }, provide: { [routerKey as symbol]: { push } } }
    })
    await flushPromises()
    const chips = w.findAll('a.md-text__chip')
    expect(chips.map((a) => a.attributes('href'))).toEqual(['/sentry/event/0b7e91c2-aaaa', '/profiler/abc-1'])
    expect(chips[0].attributes('target')).toBeUndefined()
    await chips[0].trigger('click')
    expect(push).toHaveBeenCalledWith('/sentry/event/0b7e91c2-aaaa')
  })

  it('keeps raw HTML off around app links', async () => {
    const w = await render('[<b>x</b>](/sentry/event/1) <a href="/sentry/event/2">y</a>')
    expect(w.find('b').exists()).toBe(false)
    expect(w.findAll('a')).toHaveLength(1)
  })

  it('a path with dot segments or outside the app pages stays plain text', async () => {
    const w = await render(
      '[a](/sentry/../api/x) [b](/sentry/./event/1) [c](/sentry/%2e%2e/api) [d](/api/events) [e](http://localhost:3000/sentry/../api)'
    )
    expect(w.findAll('a')).toHaveLength(0)
    expect(w.text()).toContain('[a](/sentry/../api/x)')
  })
})
