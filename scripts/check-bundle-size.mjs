// Fails the build when the first load grows past its budget (audit 2.1, 2.2).
// The first load is what dist/index.html pulls in: the entry script, its
// modulepreloads and the stylesheets. Sizes are raw bytes after minification.
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = process.argv[2] ?? new URL('../dist/', import.meta.url).pathname
const BUDGET_KB = { js: 650, css: 500 }
// Chunks that only pages other than the feed need.
const LAZY_ONLY = [/@vue-flow/, /^assets\/common-/]

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const refs = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(js|css))"/g)].map((m) => ({ path: m[1], kind: m[2] }))

const total = { js: 0, css: 0 }
for (const { path, kind } of refs) total[kind] += statSync(join(DIST, path)).size

const errors = []
for (const kind of ['js', 'css']) {
  const kb = total[kind] / 1000
  console.log(`first load ${kind}: ${kb.toFixed(1)} kB (budget ${BUDGET_KB[kind]} kB)`)
  if (kb > BUDGET_KB[kind]) errors.push(`${kind} is ${kb.toFixed(1)} kB, over the ${BUDGET_KB[kind]} kB budget`)
}
for (const { path } of refs) {
  if (LAZY_ONLY.some((re) => re.test(path))) errors.push(`${path} is loaded on start, it should load with its page`)
}

if (errors.length) {
  console.error(errors.map((e) => `bundle size: ${e}`).join('\n'))
  process.exit(1)
}
