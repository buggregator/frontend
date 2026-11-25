import MarkdownIt from 'markdown-it'

// Markdown for text that comes from outside (agents' answers), set up as
// harnsy does: raw HTML off, so <script> or <img onerror> stays text; only
// http(s) addresses become links (javascript:, data:, relative ones stay
// text) and open in a new tab; images are never loaded, their alt text is
// shown instead. Fenced code is not rendered here: MdText takes it out
// first and shows it with the shared CodeSnippet (highlight.js, escaped).
const md = new MarkdownIt({ html: false, linkify: true, typographer: false })
md.linkify.set({ fuzzyLink: false, fuzzyEmail: false, fuzzyIP: false })
for (const schema of ['mailto:', 'ftp:', '//']) md.linkify.add(schema, null)

md.validateLink = (url: string) => /^https?:\/\//i.test(url.trim())

const escape = md.utils.escapeHtml

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.image = (tokens, idx) => {
  const alt = tokens[idx].content || 'image'
  return `<span class="md-text__image">[${escape(alt)}]</span>`
}

export const renderMarkdown = (text: string): string => md.render(text ?? '')
