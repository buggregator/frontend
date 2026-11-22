import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { escapeHtml, useHighlight } from './use-highlight'

describe('useHighlight', () => {
  it('shows escaped plain text first, then the highlighted code once highlight.js is loaded', async () => {
    const { html, className } = useHighlight(ref('{"a": "<b>"}'), ref('json'))
    expect(html.value === escapeHtml('{"a": "<b>"}') || html.value.includes('hljs-')).toBe(true)

    await vi.waitFor(() => expect(html.value).toContain('<span class="hljs-'))
    expect(html.value).not.toContain('<b>')
    expect(className.value).toBe('hljs json')
  })

  it('uses the bundled languages as soon as the highlighter is there', async () => {
    for (const lang of ['json', 'html', 'xml', 'sql', 'bash', 'php', 'javascript', 'css', 'plaintext']) {
      const { active } = useHighlight(ref('x'), ref(lang))
      await vi.waitFor(() => expect(active.value).toBe(lang))
    }
  })

  it('shows plain text until a rarer language is loaded, then switches to it', async () => {
    const { active } = useHighlight(ref('a: 1'), ref('yaml'))
    expect(active.value).toBe('plaintext')
    await vi.waitFor(() => expect(active.value).toBe('yaml'))
  })

  it('falls back to plain text for a language highlight.js does not know', async () => {
    const { active, className } = useHighlight(ref('x'), ref('no-such-language'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(active.value).toBe('plaintext')
    expect(className.value).toBe('hljs plaintext')
  })

  it('follows a language change', async () => {
    const source = ref('json')
    const { active } = useHighlight(ref('select 1'), source)
    source.value = 'sql'
    await vi.waitFor(() => expect(active.value).toBe('sql'))
  })

  it('escapes the characters that would make markup', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#x27;&amp;&#x27;&lt;/a&gt;')
  })
})
