import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ValueDump from './value-dump.vue'

vi.mock('../../lib/vendor/sf-dumper', () => ({ callSfDump: vi.fn() }))

// A real Symfony VarDumper dump, as Ray sends it (src/entities/ray/mocks/ray-dump.json).
const SF_DUMP = "<pre class=sf-dump id=sf-dump-875970284 data-indent-pad=\"  \"><span class=sf-dump-note>array:2</span> [<samp data-depth=1 class=sf-dump-expanded>\n  \"<span class=sf-dump-key>a</span>\" => <span class=sf-dump-num>1</span>\n  \"<span class=sf-dump-key>b</span>\" => <span class=sf-dump-note>array:1</span> [<samp data-depth=2 class=sf-dump-compact>\n    \"<span class=sf-dump-key>c</span>\" => <span class=sf-dump-num>3</span>\n  </samp>]\n</samp>]\n</pre><script>Sfdump(\"sf-dump-875970284\")</script>\n"
const SF_DUMP_SCRIPT = '<script>Sfdump("sf-dump-875970284")</script>'

const renderedHtml = (value: string) =>
  mount(ValueDump, { props: { value } }).get('.value-dump__html').element.innerHTML

// What the browser makes of the same markup, for a like-for-like comparison.
const asParsed = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerHTML
}

describe('ValueDump: HTML values', () => {
  // A Ray or VarDumper payload is untrusted: it must not run script in our origin.
  it.each([
    ['img onerror', '<img src="x" onerror="window.__pwned = 1">'],
    ['svg onload', '<svg onload="window.__pwned = 1"></svg>'],
    ['javascript: link', '<a href="javascript:window.__pwned = 1">x</a>'],
    ['script split over lines', '<script>\nwindow.__pwned = 1\n</script>'],
    ['iframe', '<iframe src="javascript:window.__pwned = 1"></iframe>'],
  ])('drops %s', (_, payload) => {
    const html = renderedHtml(`<b>before</b>${payload}<i>after</i>`)

    expect(html).not.toMatch(/onerror|onload|javascript:|<script|<iframe/i)
    expect(html).toContain('<b>before</b>')
    expect(html).toContain('<i>after</i>')
  })

  it('keeps a real sf-dump unchanged, without its inline script and style', () => {
    const html = renderedHtml(`<style>.sf-dump{color:red}</style>${SF_DUMP}`)

    expect(SF_DUMP).toContain(SF_DUMP_SCRIPT)
    expect(html).toBe(asParsed(SF_DUMP.replace(SF_DUMP_SCRIPT, '')))
    expect(html).toContain('data-indent-pad="  "')
    expect(html).toContain('id="sf-dump-875970284"')
    expect(html).toContain('data-depth="1"')
  })
})
