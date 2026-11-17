import { describe, expect, it } from 'vitest'
import { renderReleaseNotes } from './release-notes'

describe('renderReleaseNotes', () => {
  it('turns headings, lists, bold and code into HTML', () => {
    const html = renderReleaseNotes('## Added\n- **Sentry** per service\n* `buggregator.yaml` projects\n\nPlain text.')

    expect(html).toBe(
      '<h4>Added</h4><ul><li><b>Sentry</b> per service</li><li><code>buggregator.yaml</code> projects</li></ul><p>Plain text.</p>'
    )
  })

  it('keeps only http(s) links and opens them in a new tab', () => {
    const html = renderReleaseNotes('[PR](https://github.com/x/pull/1) and [bad](javascript:alert(1))')

    expect(html).toContain('<a href="https://github.com/x/pull/1" target="_blank" rel="noopener noreferrer">PR</a>')
    expect(html).not.toContain('javascript:')
  })

  it('escapes HTML of the release body', () => {
    const html = renderReleaseNotes('<img src=x onerror=alert(1)> **<script>x</script>**')

    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script')
    expect(html).toContain('&lt;img')
  })

  it('is empty for no notes', () => {
    expect(renderReleaseNotes('')).toBe('')
    expect(renderReleaseNotes(undefined)).toBe('')
  })

  it('joins wrapped lines of a paragraph', () => {
    expect(renderReleaseNotes('one\ntwo')).toBe('<p>one two</p>')
  })
})
