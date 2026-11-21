import type { CodeRootStatus } from '@/entities/code-graph'

// Text for Settings › Code graph (#6573): one root per row.

const num = (n: number) => n.toLocaleString('en-US')

export const isRootBusy = (root: CodeRootStatus) => root.state === 'pending' || root.state === 'indexing'

// «1.9 s», «350 ms», «2 min 5 s».
export const formatTook = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return s ? `${m} min ${s} s` : `${m} min`
}

// «just now», «2 min ago», «3 h ago», «4 d ago».
export const formatAgo = (iso: string, now: number) => {
  const sec = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (Number.isNaN(sec)) return ''
  if (sec < 45) return 'just now'
  if (sec < 3600) return `${Math.max(1, Math.round(sec / 60))} min ago`
  if (sec < 86_400) return `${Math.round(sec / 3600)} h ago`
  return `${Math.round(sec / 86_400)} d ago`
}

// Share of files read in the current run, 0–100; null while the total is unknown.
export const rootProgress = (root: CodeRootStatus): number | null => {
  if (!root.files || root.files_seen === undefined) return null
  return Math.min(100, Math.round((root.files_seen / root.files) * 100))
}

export const rootSize = (root: CodeRootStatus) => {
  if (isRootBusy(root) && root.files) return `${num(root.files_seen ?? 0)} / ${num(root.files)} files`
  if (root.files === undefined) return '—'
  const parts = [`${num(root.files)} files`]
  if (root.symbols !== undefined) parts.push(`${num(root.symbols)} symbols`)
  return parts.join(' · ')
}

// «about 10 s left» from the pace so far; null until there is a pace.
export const rootTimeLeft = (root: CodeRootStatus, now: number): string | null => {
  if (root.state !== 'indexing' || !root.started_at || !root.files || !root.files_seen) return null
  const spent = now - Date.parse(root.started_at)
  if (!(spent > 0)) return null
  const left = (spent / root.files_seen) * (root.files - root.files_seen)
  return `about ${formatTook(Math.max(1000, left))} left`
}

// The ready Docker line for a folder the server cannot read.
export const mountHint = (root: CodeRootStatus) => `-v ./${root.name}:${root.path}:ro`

export type RootStatusText = { tone: 'ok' | 'busy' | 'err' | 'wait'; text: string }

export const rootStatus = (root: CodeRootStatus, now: number): RootStatusText => {
  if (root.state === 'error') return { tone: 'err', text: root.error || 'Indexing failed' }
  if (root.state === 'pending') return { tone: 'wait', text: 'Waiting' }
  if (root.state === 'indexing') {
    const p = rootProgress(root)
    return { tone: 'busy', text: p === null ? 'Indexing' : `Indexing ${p}%` }
  }
  const parts = ['Indexed']
  if (root.indexed_at) parts[0] += ` ${formatAgo(root.indexed_at, now)}`
  if (root.duration_ms !== undefined) parts.push(`took ${formatTook(root.duration_ms)}`)
  return { tone: 'ok', text: parts.join(' · ') }
}
