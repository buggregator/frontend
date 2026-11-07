import type { VarDump } from '../types'

type Source = VarDump['context']['source']
type BuildLink = (file: string, line?: number) => string | null

// IDE schemes a dump's file_link may use: Symfony's FileLinkFormatter presets
// and common editors. Anything else (file:// is Symfony's default with no IDE
// set and points into the container; http(s), OS handlers, script schemes)
// falls back to the link built from Settings.
const IDE_SCHEMES = [
  'phpstorm', 'idea', 'vscode', 'vscode-insiders', 'vscodium', 'cursor', 'windsurf', 'zed',
  'subl', 'txmt', 'mvim', 'emacs', 'editor', 'atom', 'nova', 'fleet', 'netbeans',
]

// The scheme of a link, read the way a browser does: control characters and
// whitespace inside it are dropped, case ignored. null when there is none.
const schemeOf = (link: string): string | null => {
  // eslint-disable-next-line no-control-regex
  const match = link.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z0-9+.-]*):/i)
  return match ? match[1].toLowerCase() : null
}

// Link for the dump's source (GitHub server#255). When the person set things up
// in Settings (picked an editor or turned path mapping on), the Settings link
// wins. Otherwise the SDK's file_link (Symfony
// file_link_format, local path already mapped) is used as is when it is an IDE
// link; else the link is built from the Settings defaults.
export const sourceLink = (
  source: Source | undefined,
  buildLink: BuildLink,
  preferSettings: boolean,
): string | null => {
  if (!source) return null
  if (preferSettings) return buildLink(source.file, source.line)

  const fileLink = typeof source.file_link === 'string' ? source.file_link.trim() : ''
  const scheme = fileLink ? schemeOf(fileLink) : null
  if (scheme && IDE_SCHEMES.includes(scheme)) {
    return fileLink
  }

  return buildLink(source.file, source.line)
}
