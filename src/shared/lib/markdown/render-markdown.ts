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

// The app's own pages (an agent pointing at an event): a relative path or a
// full address on this origin whose first part is a section of the app.
// They become chips that open inside the app (MdText routes the click).
const APP_SECTIONS = new Set([
  'sentry', 'profiler', 'smtp', 'sms', 'http-dump', 'inspector', 'var-dump', 'monolog', 'ray',
  'broadcast', 'logs', 'mock-server', 'audit', 'metrics', 'xdebug', 'favorites', 'settings'
])

const currentOrigin = () => (typeof window === 'undefined' ? '' : window.location.origin)

// The in-app path of a link, or null when it is not one of the app's pages.
export const appRouteOf = (url: string, origin = currentOrigin()): string | null => {
  let path = url.trim()
  if (/^https?:\/\//i.test(path)) {
    if (!origin || !path.toLowerCase().startsWith(`${origin.toLowerCase()}/`)) return null
    path = path.slice(origin.length)
  }
  if (!/^\/(?!\/)/.test(path) || /[\s"'<>\\]/.test(path)) return null
  const section = path.slice(1).split(/[/?#]/)[0]
  return APP_SECTIONS.has(section) ? path : null
}

md.validateLink = (url: string) => /^https?:\/\//i.test(url.trim()) || appRouteOf(url) !== null

const escape = md.utils.escapeHtml

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  const route = appRouteOf(token.attrGet('href') ?? '')
  if (route) {
    token.attrSet('href', route)
    token.attrSet('class', 'md-text__chip')
    token.attrSet('data-app-route', '')
  } else {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.image = (tokens, idx) => {
  const alt = tokens[idx].content || 'image'
  return `<span class="md-text__image">[${escape(alt)}]</span>`
}

export const renderMarkdown = (text: string): string => md.render(text ?? '')
