// An agent's answer split into prose and fenced code blocks (``` or ~~~).
// Code goes to the shared CodeSnippet (highlighting, theme, copy); prose to
// the Markdown renderer. An unclosed fence runs to the end of the text.
export type MarkdownSegment =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; language: string; code: string }

// Any indent: a fence inside a list item sits deeper than 3 spaces. A
// backtick fence's info string has no backticks (```js``` is inline code).
const OPEN = /^([ \t]*)(`{3,}|~{3,})(.*)$/

const opener = (line: string) => {
  const m = OPEN.exec(line)
  if (!m) return null
  const [, indent, fence, rest] = m
  if (fence[0] === '`' && rest.includes('`')) return null
  const language = /^\s*([\w+#.-]*)/.exec(rest)?.[1] ?? ''
  return { indent: indent.length, fence, language }
}

// A code line loses at most the opener's indent (the list item's).
const unindent = (line: string, n: number) => {
  let i = 0
  while (i < n && (line[i] === ' ' || line[i] === '\t')) i++
  return line.slice(i)
}

export const splitFences = (text: string): MarkdownSegment[] => {
  const out: MarkdownSegment[] = []
  let prose: string[] = []
  let code: string[] | null = null
  let fence = ''
  let language = ''
  let indent = 0

  const flushProse = () => {
    const t = prose.join('\n')
    if (t.trim()) out.push({ kind: 'prose', text: t })
    prose = []
  }

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (code === null) {
      const m = opener(line)
      if (m) {
        flushProse()
        code = []
        fence = m.fence
        language = m.language.toLowerCase()
        indent = m.indent
      } else {
        prose.push(line)
      }
      continue
    }
    const close = line.trim()
    if (close.startsWith(fence[0].repeat(fence.length)) && /^[`~]+$/.test(close) && close[0] === fence[0]) {
      out.push({ kind: 'code', language, code: code.join('\n') })
      code = null
    } else {
      code.push(unindent(line, indent))
    }
  }
  if (code !== null) out.push({ kind: 'code', language, code: code.join('\n') })
  flushProse()
  return out
}
