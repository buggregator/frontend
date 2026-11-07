import { describe, expect, it, vi } from 'vitest'
import { sourceLink } from './source-link'

const source = {
  name: 'HomeController.php',
  file: '/var/www/app/src/HomeController.php',
  line: 52,
  file_excerpt: false,
}
const buildLink = vi.fn((file: string, line?: number) => `phpstorm://open?file=${file}&line=${line}`)
const built = 'phpstorm://open?file=/var/www/app/src/HomeController.php&line=52'

describe('sourceLink', () => {
  const ideLink = 'phpstorm://open?file=/home/me/app/src/HomeController.php&line=52'

  it('uses the IDE link the SDK sent, as is, when no IDE is chosen in Settings', () => {
    expect(sourceLink({ ...source, file_link: ideLink }, buildLink, false)).toBe(ideLink)
  })

  it('builds the link from Settings when an IDE is chosen there', () => {
    expect(sourceLink({ ...source, file_link: ideLink }, buildLink, true)).toBe(built)
  })

  it('builds the link from Settings for Symfony\'s default file:// link', () => {
    expect(sourceLink({ ...source, file_link: 'file:///var/www/app/src/HomeController.php#L52' }, buildLink, false)).toBe(built)
  })

  it('builds the link from Settings when the SDK sent none', () => {
    expect(sourceLink(source, buildLink, false)).toBe(built)
    expect(sourceLink({ ...source, file_link: '' }, buildLink, false)).toBe(built)
    expect(sourceLink({ ...source, file_link: '   ' }, buildLink, false)).toBe(built)
  })

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'https://example.com/HomeController.php',
    'http://example.com/HomeController.php',
    'FILE:///var/www/app/src/HomeController.php',
    '/relative/path.php',
  ])('does not use a link that is not an IDE link: %j', (fileLink) => {
    expect(sourceLink({ ...source, file_link: fileLink }, buildLink, false)).toBe(built)
  })

  it('gives nothing without a source', () => {
    expect(sourceLink(undefined, buildLink, false)).toBeNull()
  })
})
