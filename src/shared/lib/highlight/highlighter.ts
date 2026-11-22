import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'

// The highlighter is its own chunk (#6841): use-highlight imports it on the
// first code snippet, not with the app. The languages the app asks for
// itself (event payloads, HTTP bodies, SQL, curl) come with it; `xml` also
// answers to `html`.
const BUNDLED = { bash, css, javascript, json, php, plaintext, sql, xml }
for (const [name, language] of Object.entries(BUNDLED)) {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, language)
}

export const knows = (language: string): boolean => Boolean(language) && Boolean(hljs.getLanguage(language))

export const highlight = (code: string, language: string): string =>
  hljs.highlight(code, { language, ignoreIllegals: true }).value

// A dump may name any language (VarDumper's `language` context). The rest of
// highlight.js's common set loads on the first such request.
let common: Promise<unknown> | null = null
export const loadCommonLanguages = () => (common ??= import('highlight.js/lib/common'))
