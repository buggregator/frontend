// A GitHub release body (markdown) as HTML for «What's new». Only the small
// part releases use: headings, lists, paragraphs, bold, inline code and
// http(s) links. The text is escaped first, so the result holds no markup but
// the tags made here.

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const inline = (escaped: string) =>
  escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) =>
      /^https?:\/\//i.test(url)
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label
    )

export const renderReleaseNotes = (markdown: string | undefined): string => {
  if (!markdown?.trim()) return ''

  const out: string[] = []
  let list: string[] = []
  let paragraph: string[] = []

  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((item) => `<li>${item}</li>`).join('')}</ul>`)
    list = []
  }
  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.join(' ')}</p>`)
    paragraph = []
  }

  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const item = line.match(/^[-*+]\s+(.*)$/)

    if (!line) {
      flushList()
      flushParagraph()
    } else if (heading) {
      flushList()
      flushParagraph()
      out.push(`<h4>${inline(escapeHtml(heading[1]))}</h4>`)
    } else if (item) {
      flushParagraph()
      list.push(inline(escapeHtml(item[1])))
    } else {
      flushList()
      paragraph.push(inline(escapeHtml(line)))
    }
  }

  flushList()
  flushParagraph()

  return out.join('')
}
