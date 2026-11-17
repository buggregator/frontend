// GET /api/update (server PR «self-update»). Older servers answer 404: the
// whole feature stays hidden there.

// self: the server can replace its own binary; manual: Docker, Kubernetes or
// no write rights, the person runs a command; off: switched off (see reason).
export type UpdateMode = 'self' | 'manual' | 'off'

export type UpdateInstall = 'binary' | 'docker' | 'kubernetes'

export type UpdatePhase =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'restarting'
  | 'done'
  | 'failed'
  | 'rolled_back'
  | 'restart_required'

// Also the payload of the WebSocket event `update.progress`.
export type UpdateState = {
  phase: UpdatePhase
  // The version being installed (or installed, after done).
  version: string
  bytes: number
  total: number
  error: string
  at: string
  // The step that failed: download, verify, install or restart.
  failed_step?: string
  // The version that ran before the update.
  previous?: string
  // rolled_back: the last lines the new version printed (≤ 8 KB).
  log?: string
}

export type UpdateCommand = {
  id: string
  label: string
  command: string
}

export type UpdateStatus = {
  current: string
  // latest, url and checked_at come with the first check.
  latest?: string
  available: boolean
  url?: string
  checked_at?: string
  // Release body (markdown); "" when the release has none.
  notes?: string
  mode: UpdateMode
  // Why the mode is not self, in words; may name the setting that changes it.
  reason: string
  install: UpdateInstall
  // manual: what to run, one entry per way of running Buggregator.
  commands?: UpdateCommand[]
  // The database is :memory: — an update (a restart) deletes every event.
  memory_db: boolean
  // Windows console: the server cannot restart itself.
  restart_manual: boolean
  check_enabled?: boolean
  os?: string
  state: UpdateState
}

// Error body of /api/update*: `code` is the HTTP status.
export type UpdateErrorBody = {
  message?: string
  code?: number
  retry_after?: number
}
