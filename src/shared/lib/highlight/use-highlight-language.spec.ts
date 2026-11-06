import hljs from 'highlight.js/lib/core'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useHighlightLanguage } from './use-highlight-language'

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

describe('useHighlightLanguage', () => {
  it('uses the bundled languages right away', () => {
    for (const lang of ['json', 'html', 'xml', 'sql', 'bash', 'php', 'javascript', 'css', 'plaintext']) {
      expect(useHighlightLanguage(ref(lang)).value).toBe(lang)
    }
  })

  it('shows plain text until a rarer language is loaded, then switches to it', async () => {
    expect(hljs.getLanguage('yaml')).toBeUndefined()
    const language = useHighlightLanguage(ref('yaml'))
    expect(language.value).toBe('plaintext')

    await vi.waitFor(() => expect(language.value).toBe('yaml'))
  })

  it('falls back to plain text for a language highlight.js does not know', async () => {
    const language = useHighlightLanguage(ref('no-such-language'))
    await flush()
    expect(language.value).toBe('plaintext')
  })

  it('follows a language change', async () => {
    const source = ref('json')
    const language = useHighlightLanguage(source)
    source.value = 'sql'
    await flush()
    expect(language.value).toBe('sql')
  })
})
