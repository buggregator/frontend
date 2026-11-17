import type { UpdateState, UpdateStatus } from '../types'

// Example answers of GET /api/update for stories and tests: one per state the
// Settings page shows. Example data from the v2.10.0 release.

export const MOCK_CURRENT = '2.9.0'
export const MOCK_LATEST = '2.10.0'
const SIZE = 39_741_440

export const mockNotes = `## Before you upgrade
- **Sentry requests larger than 64 MB are no longer stored.** Real Sentry events are far smaller.

## Added
- **Sentry: a project per service**, even with a numeric DSN.
- **SMS: Twilio's send API.**

## Fixed
- Projects from \`buggregator.yaml\` exist from the first start.
- **Sentry timestamps are returned in UTC**, so the UI shows the right local time.
- HTTP proxy: compressed bodies decoded, large bodies pass through whole ([#412](https://github.com/buggregator/server/pull/412)).`

const idle: UpdateState = { phase: 'idle', version: '', bytes: 0, total: 0, error: '', at: '', failed_step: '', previous: '', log: '' }

const base: UpdateStatus = {
  current: MOCK_CURRENT,
  latest: MOCK_LATEST,
  available: true,
  url: `https://github.com/buggregator/server/releases/tag/v${MOCK_LATEST}`,
  checked_at: '2026-11-17T08:00:00Z',
  notes: mockNotes,
  mode: 'self',
  reason: '',
  install: 'binary',
  commands: [],
  memory_db: false,
  restart_manual: false,
  check_enabled: true,
  os: 'linux',
  state: idle,
}

const running = (state: Partial<UpdateState>): UpdateStatus => ({
  ...base,
  state: { ...idle, version: MOCK_LATEST, previous: MOCK_CURRENT, at: '2026-11-17T10:24:00Z', total: SIZE, ...state },
})

export const neverCheckedStatus: UpdateStatus = {
  ...base,
  latest: undefined,
  url: undefined,
  checked_at: undefined,
  available: false,
  notes: '',
}

export const upToDateStatus: UpdateStatus = {
  ...base,
  current: MOCK_LATEST,
  available: false,
}

export const availableStatus: UpdateStatus = base

export const memoryDbStatus: UpdateStatus = { ...base, memory_db: true }

export const downloadingStatus = running({ phase: 'downloading', bytes: Math.round(SIZE * 0.42) })
export const verifyingStatus = running({ phase: 'verifying', bytes: SIZE })
export const installingStatus = running({ phase: 'installing', bytes: SIZE })
export const restartingStatus = running({ phase: 'restarting', bytes: SIZE })

// After the reload: the new version runs.
export const doneStatus: UpdateStatus = {
  ...base,
  current: MOCK_LATEST,
  available: false,
  state: { ...idle, phase: 'done', version: MOCK_LATEST, previous: MOCK_CURRENT, at: '2026-11-17T09:35:00Z' },
}

export const failedStatus = running({
  phase: 'failed',
  bytes: Math.round(SIZE * 0.4),
  failed_step: 'download',
  error: 'connection reset after 15.9 of 37.9 MB',
})

export const rolledBackStatus = running({
  phase: 'rolled_back',
  bytes: SIZE,
  failed_step: 'restart',
  error: 'exited 3 s after start: listen tcp :1025: bind: address already in use',
  log: 'time=2026-11-17T10:25:01Z level=INFO msg="starting buggregator" version=2.10.0\ntime=2026-11-17T10:25:03Z level=ERROR msg="smtp server" err="listen tcp :1025: bind: address already in use"',
})

export const restartRequiredStatus: UpdateStatus = {
  ...running({ phase: 'restart_required', bytes: SIZE }),
  restart_manual: true,
  os: 'windows',
}

export const dockerStatus: UpdateStatus = {
  ...base,
  mode: 'manual',
  install: 'docker',
  reason: 'Buggregator runs in a container: update it by pulling the new image and recreating the container. Your data stays if it is on a volume.',
  commands: [
    { id: 'docker', label: 'Docker', command: `docker pull ghcr.io/buggregator/server:${MOCK_LATEST}\n# then recreate the container with the same docker run options` },
    { id: 'compose', label: 'Compose', command: 'docker compose pull buggregator\ndocker compose up -d buggregator' },
    { id: 'helm', label: 'Helm', command: `helm upgrade buggregator ./helm-chart --set image.tag=${MOCK_LATEST}` },
  ],
}

export const offStatus: UpdateStatus = {
  ...base,
  mode: 'off',
  reason: 'Sign-in is off and this server is reachable from the network, so anyone who opens this page could restart it. Turn on sign-in, or set update.self_update: on (env UPDATE_SELF=on) if you accept that.',
}

export const updateStatusMocks = {
  neverChecked: neverCheckedStatus,
  upToDate: upToDateStatus,
  available: availableStatus,
  memoryDb: memoryDbStatus,
  downloading: downloadingStatus,
  verifying: verifyingStatus,
  installing: installingStatus,
  restarting: restartingStatus,
  done: doneStatus,
  failed: failedStatus,
  rolledBack: rolledBackStatus,
  restartRequired: restartRequiredStatus,
  docker: dockerStatus,
  off: offStatus,
}
