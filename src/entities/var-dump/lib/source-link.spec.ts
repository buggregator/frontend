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

  it.each([
    'phpstorm://open?file=/a.php&line=1',
    'idea://open?file=/a.php&line=1',
    'vscode://file//a.php:1',
    'vscode-insiders://file//a.php:1',
    'vscodium://file//a.php:1',
    'cursor://file//a.php:1',
    'windsurf://file//a.php:1',
    'zed://file/a.php:1',
    'subl://open?url=file:///a.php&line=1',
    'txmt://open?url=file:///a.php&line=1',
    'mvim://open?url=file:///a.php&line=1',
    'emacs://open?url=file:///a.php&line=1',
    'editor://open?file=/a.php&line=1',
    'atom://core/open/file?filename=/a.php&line=1',
    'nova://open?path=/a.php&line=1',
    'fleet://open?file=/a.php&line=1',
    'netbeans://open/?f=/a.php:1',
    'PhpStorm://open?file=/a.php&line=1',
  ])('uses a known IDE link %j', (fileLink) => {
    expect(sourceLink({ ...source, file_link: fileLink }, buildLink, false)).toBe(fileLink)
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
    'ms-msdt:/id PCWDiagnostic',
    'search-ms:query=x',
    'mailto:me@example.com',
    'unknown-ide://open?file=/a.php',
    '/relative/path.php',
  ])('does not use a link that is not an IDE link: %j', (fileLink) => {
    expect(sourceLink({ ...source, file_link: fileLink }, buildLink, false)).toBe(built)
  })

  it('gives nothing without a source', () => {
    expect(sourceLink(undefined, buildLink, false)).toBeNull()
  })
})
