import type { VarDump } from '../types'

type Source = VarDump['context']['source']
type BuildLink = (file: string, line?: number) => string | null

// Not IDE links: file:// is Symfony's default when the app sets no IDE (the
// container path, no mapping), http(s) opens a page, the rest run code.
const NOT_IDE_SCHEMES = ['file', 'http', 'https', 'javascript', 'data', 'vbscript']

// The scheme of a link, read the way a browser does: control characters and
// whitespace inside it are dropped, case ignored. null when there is none.
const schemeOf = (link: string): string | null => {
  // eslint-disable-next-line no-control-regex
  const match = link.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z0-9+.-]*):/i)
  return match ? match[1].toLowerCase() : null
}

// Link for the dump's source (GitHub server#255). An IDE the person chose in
// Settings wins, with its path mapping. Otherwise the SDK's file_link (Symfony
// file_link_format, local path already mapped) is used as is when it is an IDE
// link; else the link is built from the Settings defaults.
export const sourceLink = (
  source: Source | undefined,
  buildLink: BuildLink,
  isEditorChosen: boolean,
): string | null => {
  if (!source) return null
  if (isEditorChosen) return buildLink(source.file, source.line)

  const fileLink = typeof source.file_link === 'string' ? source.file_link.trim() : ''
  const scheme = fileLink ? schemeOf(fileLink) : null
  if (scheme && !NOT_IDE_SCHEMES.includes(scheme)) {
    return fileLink
  }

  return buildLink(source.file, source.line)
}
