import type { UpdateCommand, UpdatePhase, UpdateStatus } from '../types'

// What the Settings › About & updates block shows for a status: one pure
// mapping, so every state is tested without mounting anything.

export const REPORT_ISSUE_URL = 'https://github.com/buggregator/server/issues/new'

export type UpdateKind = 'current' | 'available' | 'progress' | 'done' | 'failed' | 'rolled_back' | 'restart_required'

export type StepId = 'download' | 'verify' | 'install' | 'restart'
export type StepState = 'waiting' | 'now' | 'done' | 'failed'
export type StepView = { id: StepId; label: string; aux: string; state: StepState }

export type BadgeTone = 'ok' | 'new' | 'bad' | 'warn' | 'muted'
export type BadgeIcon = 'check' | 'up' | 'spinner' | 'alert' | 'undo' | 'terminal' | 'info'

export type UpdateAction =
  | { kind: 'release-notes'; href: string }
  | { kind: 'update'; label: string; version: string; danger: boolean }
  | { kind: 'locked'; label: string }
  | { kind: 'retry'; version: string; danger: boolean }
  | { kind: 'copy-log' }
  | { kind: 'report'; href: string }

export type UpdateView = {
  kind: UpdateKind
  // The version that runs now.
  version: string
  // The version being (or just) installed, and the one before it.
  target: string
  previous: string
  badge: { tone: BadgeTone; icon: BadgeIcon; text: string }
  meta: string
  canCheck: boolean
  actions: UpdateAction[]
  memoryWarning: boolean
  hint: string
  manual: { text: string; commands: UpdateCommand[] } | null
  offReason: string
  progress: { line: string; percent: number | null; restarting: boolean } | null
  steps: StepView[]
  failure: { step: string; error: string; previous: string } | null
  rollback: { target: string; previous: string; error: string } | null
  log: string
  notesTitle: string
}

export type UpdateViewInput = {
  status: UpdateStatus
  // The server version this tab loaded with.
  loadedVersion: string
  checking: boolean
  now: number
}

export const ACTIVE_PHASES: UpdatePhase[] = ['downloading', 'verifying', 'installing', 'restarting']

export const isActivePhase = (phase: UpdatePhase | undefined) => !!phase && ACTIVE_PHASES.includes(phase)

export const timeAgo = (iso: string | undefined, now: number): string => {
  const time = iso ? Date.parse(iso) : NaN
  if (Number.isNaN(time)) return ''

  const minutes = Math.floor((now - time) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

const clock = (iso: string | undefined): string => {
  const time = iso ? new Date(iso) : null
  if (!time || Number.isNaN(time.getTime())) return ''
  return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
}

const megabytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1)

export const downloadPercent = (bytes: number, total: number): number | null =>
  total > 0 ? Math.max(0, Math.min(100, Math.floor((bytes / total) * 100))) : null

const STEP_ORDER: StepId[] = ['download', 'verify', 'install', 'restart']

const PHASE_STEP: Partial<Record<UpdatePhase, StepId>> = {
  downloading: 'download',
  verifying: 'verify',
  installing: 'install',
  restarting: 'restart',
}

const STEP_NAMES: Record<StepId, string> = {
  download: 'Download',
  verify: 'Checksum check',
  install: 'Install',
  restart: 'Restart',
}

// The server may name the step or the phase it was in.
const toStepId = (raw: string | undefined): StepId | null => {
  const value = (raw ?? '').toLowerCase()
  if (value.startsWith('download')) return 'download'
  if (value.startsWith('verif') || value.startsWith('checksum')) return 'verify'
  if (value.startsWith('install')) return 'install'
  if (value.startsWith('restart')) return 'restart'
  return null
}

const kindOf = (status: UpdateStatus): UpdateKind => {
  const phase = status.state?.phase
  if (isActivePhase(phase)) return 'progress'
  if (phase === 'done' || phase === 'failed' || phase === 'rolled_back' || phase === 'restart_required') return phase
  return status.available && status.latest ? 'available' : 'current'
}

const buildSteps = (status: UpdateStatus, kind: UpdateKind, previous: string): StepView[] => {
  if (kind !== 'progress' && kind !== 'failed') return []

  const { state } = status
  const failed = kind === 'failed' ? toStepId(state.failed_step) : null
  const nowStep = kind === 'progress' ? PHASE_STEP[state.phase] ?? null : null
  const pivot = failed ?? nowStep
  const pivotIndex = pivot ? STEP_ORDER.indexOf(pivot) : -1

  const stateOf = (index: number): StepState => {
    if (pivotIndex < 0) return 'waiting'
    if (index < pivotIndex) return 'done'
    if (index === pivotIndex) return failed ? 'failed' : 'now'
    return 'waiting'
  }

  const downloadAux = () => {
    if (state.total <= 0) return ''
    if (state.phase === 'downloading' || (failed === 'download')) {
      return `${megabytes(state.bytes)} of ${megabytes(state.total)} MB`
    }
    return pivotIndex > 0 ? `${megabytes(state.total)} MB` : ''
  }

  const labels: Record<StepId, [string, string]> = {
    download: ['Download', downloadAux()],
    verify: ['Verify checksum', 'sha256'],
    install: [`Install, keep ${previous} as backup`, ''],
    restart: ['Restart', state.phase === 'restarting' ? 'reconnecting…' : ''],
  }

  return STEP_ORDER.map((id, index) => ({ id, label: labels[id][0], aux: labels[id][1], state: stateOf(index) }))
}

const progressLine = (status: UpdateStatus, target: string, previous: string, percent: number | null) => {
  switch (status.state.phase) {
    case 'downloading':
      return percent === null ? `Downloading ${target}…` : `Downloading ${target}… ${percent}%`
    case 'verifying':
      return 'Checking the download (sha256)…'
    case 'installing':
      return `Installing ${target}, keeping ${previous} as a backup…`
    default:
      return 'Restarting. The page reloads by itself…'
  }
}

const MANUAL_TEXT: Record<string, string> = {
  docker: 'Buggregator runs in a container: pull the new image and recreate the container. Your data stays if it is on a volume.',
  kubernetes: 'Buggregator runs in Kubernetes: upgrade the release with the new image tag. Your data stays if it is on a persistent volume.',
  binary: 'Buggregator cannot replace its own file here. Run the command yourself, then restart Buggregator.',
}

const reportUrl = (status: UpdateStatus, target: string, previous: string) => {
  const body = [
    `Updating Buggregator from ${previous} to ${target} from the web interface was rolled back: ${target} did not start.`,
    '',
    `Error: ${status.state.error || '(none)'}`,
    `OS: ${status.os || 'unknown'}, install: ${status.install}`,
    '',
    'Log (use «Copy log» on the Settings page and paste it here):',
    '',
  ].join('\n')
  const query = new URLSearchParams({ title: `Update to ${target} rolled back`, body })
  return `${REPORT_ISSUE_URL}?${query.toString()}`
}

export const toUpdateView = ({ status, loadedVersion, checking, now }: UpdateViewInput): UpdateView => {
  const kind = kindOf(status)
  const { state } = status
  const target = state.version || status.latest || ''
  const previous = state.previous || loadedVersion || status.current
  const latest = status.latest ?? ''
  const percent = state.phase === 'downloading' ? downloadPercent(state.bytes, state.total) : null
  const isSelf = status.mode === 'self'

  const view: UpdateView = {
    kind,
    version: status.current,
    target,
    previous,
    badge: { tone: 'muted', icon: 'info', text: '' },
    meta: '',
    canCheck: kind !== 'progress' && kind !== 'restart_required',
    actions: [],
    memoryWarning: false,
    hint: '',
    manual: null,
    offReason: '',
    progress: null,
    steps: buildSteps(status, kind, previous),
    failure: null,
    rollback: null,
    log: '',
    notesTitle: '',
  }

  const checkedAgo = timeAgo(status.checked_at, now)
  view.meta = checkedAgo
    ? `Last checked ${checkedAgo}`
    : status.check_enabled === false ? 'Automatic checks are off' : 'No check yet'

  const releaseNotes = (): UpdateAction[] => (status.url ? [{ kind: 'release-notes', href: status.url }] : [])

  switch (kind) {
    case 'current':
      view.badge = latest
        ? { tone: 'ok', icon: 'check', text: 'Up to date' }
        : { tone: 'muted', icon: 'info', text: 'Not checked yet' }
      break

    case 'available':
      view.badge = { tone: 'new', icon: 'up', text: `${latest} is available` }
      view.notesTitle = `What's new in ${latest}`
      if (isSelf) {
        view.memoryWarning = status.memory_db
        view.actions = [
          ...releaseNotes(),
          {
            kind: 'update',
            label: status.memory_db ? 'Delete events and update' : `Update to ${latest}`,
            version: latest,
            danger: status.memory_db,
          },
        ]
        view.hint = status.restart_manual
          ? `Download, checksum check (sha256), replace. Then restart Buggregator yourself: it runs in a console window. ${status.current} runs until then.`
          : `Download, checksum check (sha256), replace, restart: about a minute. If ${latest} does not start, ${status.current} comes back by itself.`
      } else if (status.mode === 'manual') {
        view.actions = releaseNotes()
        view.manual = {
          text: status.reason || MANUAL_TEXT[status.install] || MANUAL_TEXT.binary,
          commands: status.commands ?? [],
        }
      } else {
        view.actions = [...releaseNotes(), { kind: 'locked', label: `Update to ${latest}` }]
        view.offReason = status.reason || 'Updating from this page is switched off on the server.'
      }
      break

    case 'progress': {
      const started = clock(state.at)
      view.badge = { tone: 'new', icon: 'spinner', text: `Updating to ${target}` }
      view.meta = started ? `Started ${started} · do not close the server's window` : "Do not close the server's window"
      view.progress = {
        line: progressLine(status, target, previous, percent),
        percent,
        restarting: state.phase === 'restarting',
      }
      view.notesTitle = `What's new in ${target}`
      break
    }

    case 'done': {
      const ago = timeAgo(state.at, now)
      view.badge = { tone: 'ok', icon: 'check', text: `Updated from ${previous}` }
      view.meta = `${ago ? `Updated ${ago}` : 'Updated'} · ${previous} kept as backup until the next update`
      view.notesTitle = 'What changed'
      break
    }

    case 'failed': {
      const step = toStepId(state.failed_step)
      view.badge = { tone: 'bad', icon: 'alert', text: 'Update failed' }
      view.failure = { step: step ? STEP_NAMES[step] : '', error: state.error, previous }
      view.memoryWarning = isSelf && status.memory_db
      view.actions = isSelf ? [{ kind: 'retry', version: target, danger: status.memory_db }] : []
      view.notesTitle = target ? `What's new in ${target}` : ''
      break
    }

    case 'rolled_back':
      view.badge = { tone: 'warn', icon: 'undo', text: `Rolled back from ${target}` }
      view.rollback = { target, previous, error: state.error }
      view.log = state.log || state.error
      view.actions = [{ kind: 'copy-log' }, { kind: 'report', href: reportUrl(status, target, previous) }]
      view.notesTitle = `What's new in ${target}`
      break

    case 'restart_required':
      view.badge = { tone: 'warn', icon: 'terminal', text: `${target} installed, waiting for restart` }
      view.meta = ''
      break
  }

  if (checking && (kind === 'current' || kind === 'available')) {
    view.badge = { tone: 'new', icon: 'spinner', text: 'Checking for updates' }
  }

  return view
}
