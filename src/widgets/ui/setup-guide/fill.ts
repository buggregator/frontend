// Placeholders of the content file and how they get their values (#5941).
// Only these keys are replaced: the code samples contain other `{…}`.
const PLACEHOLDER = /\{(host|http_port|smtp_port|monolog_port|vardumper_port|proxy_port|xdebug_port|project|project_js)\}/g
const PORT_PLACEHOLDER = /\{(\w+_port)\}/g

// /api/settings `ports` key → placeholder.
const PORT_KEYS: Record<string, string> = {
  http: 'http_port',
  smtp: 'smtp_port',
  monolog: 'monolog_port',
  var_dumper: 'vardumper_port',
  proxy: 'proxy_port',
  xdebug: 'xdebug_port'
}

export type Segment = { text: string; fill: boolean }

export const fillSegments = (src: string, values: Record<string, string>): Segment[] => {
  const out: Segment[] = []
  let last = 0
  const push = (text: string, fill: boolean) => {
    if (!text) return
    const prev = out[out.length - 1]
    if (prev && prev.fill === fill && !fill) prev.text += text
    else out.push({ text, fill })
  }
  for (const m of src.matchAll(PLACEHOLDER)) {
    const value = values[m[1]]
    push(src.slice(last, m.index), false)
    if (value === undefined) push(m[0], false)
    else push(value, true)
    last = (m.index ?? 0) + m[0].length
  }
  push(src.slice(last), false)
  return out
}

export const fillText = (src: string, values: Record<string, string>): string =>
  fillSegments(src, values)
    .map((s) => s.text)
    .join('')

// The JS SDK refuses `-` in the DSN key; the server finds `iris-app` by `iris_app`.
export const projectJs = (key: string) => key.replace(/-/g, '_')

export const usedPorts = (src: string): string[] => [
  ...new Set(Array.from(src.matchAll(PORT_PLACEHOLDER), (m) => m[1]))
]

// `defaulted`: every port shown as its default. `off`: the server sent its
// ports but not this one — that listener is off (Xdebug proxy by default),
// as opposed to an old server that sends no ports at all.
export const resolveValues = ({
  host,
  projectKey,
  ports,
  defaults
}: {
  host: string
  projectKey: string
  ports: Record<string, number> | null
  defaults: Record<string, number>
}) => {
  const project = projectKey || 'default'
  const values: Record<string, string> = { host, project, project_js: projectJs(project) }
  const defaulted = new Set<string>()
  const off = new Set<string>()
  for (const [name, fallback] of Object.entries(defaults)) {
    const serverKey = Object.keys(PORT_KEYS).find((k) => PORT_KEYS[k] === name)
    const port = serverKey ? ports?.[serverKey] : undefined
    if (port) {
      values[name] = String(port)
    } else {
      values[name] = String(fallback)
      defaulted.add(name)
      if (ports) off.add(name)
    }
  }
  return { values, defaulted, off }
}

// The HTTP port the app should use, from the page address. An explicit port
// wins (Docker -p 9000:8000: the server only knows 8000). No port in the
// address means a reverse proxy or ingress on the scheme's port: 80, or 443
// on https (the samples say http://, so the guide tells to switch the scheme).
// `null`: no page address to go by, keep the server's own port.
export const pageHttpPort = (loc: { protocol: string; port: string }) => {
  if (loc.port) return { port: loc.port, https: loc.protocol === 'https:' }
  if (loc.protocol === 'https:') return { port: '443', https: true }
  if (loc.protocol === 'http:') return { port: '80', https: false }
  return null
}
