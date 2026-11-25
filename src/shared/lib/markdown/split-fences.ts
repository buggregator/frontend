// An agent's answer split into prose and fenced code blocks (``` or ~~~).
// Code goes to the shared CodeSnippet (highlighting, theme, copy); prose to
// the Markdown renderer. An unclosed fence runs to the end of the text.
export type MarkdownSegment =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; language: string; code: string }

const OPEN = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)[^\n]*$/

export const splitFences = (text: string): MarkdownSegment[] => {
  const out: MarkdownSegment[] = []
  let prose: string[] = []
  let code: string[] | null = null
  let fence = ''
  let language = ''

  const flushProse = () => {
    const t = prose.join('\n')
    if (t.trim()) out.push({ kind: 'prose', text: t })
    prose = []
  }

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (code === null) {
      const m = OPEN.exec(line)
      if (m) {
        flushProse()
        code = []
        fence = m[1]
        language = m[2].toLowerCase()
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
      code.push(line)
    }
  }
  if (code !== null) out.push({ kind: 'code', language, code: code.join('\n') })
  flushProse()
  return out
}
