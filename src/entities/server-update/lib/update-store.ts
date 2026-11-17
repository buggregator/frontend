import { defineStore } from 'pinia'
import { useConnectionStore } from '@/shared/stores'
import type { UpdateState, UpdateStatus } from '../types'
import { startRestartWatch } from './restart-watch'
import { onUpdateProgress } from './update-bus'
import { UpdateApiError, useUpdateRequests } from './update-requests'
import { downloadPercent, isActivePhase } from './update-view'

// While a download runs and the socket is down, the state is asked for over
// REST this often.
const POLL_INTERVAL = 2000

// Timers live outside the state: one set per page load.
let stopRestartWatch: (() => void) | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let stopListening: (() => void) | null = null
let reloadPage: () => void = () => window.location.reload()

const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

const stopWatching = () => {
  stopRestartWatch?.()
  stopRestartWatch = null
}

const describeError = (e: unknown) =>
  e instanceof UpdateApiError ? e.message : e instanceof TypeError ? 'the server cannot be reached.' : String(e)

export type UpdateIndicator = {
  label: string
  percent: number | null
  restarting: boolean
  ariaLabel: string
}

type InitOptions = {
  // Tests pass their own reload and skip the socket.
  reload?: () => void
  listen?: boolean
}

export const useServerUpdateStore = defineStore('serverUpdateStore', {
  state: () => ({
    status: null as UpdateStatus | null,
    // null: not known yet; false: an older server without /api/update.
    supported: null as boolean | null,
    // The server version this tab loaded with; another one answering after a
    // restart means the update went through.
    loadedVersion: '',
    checking: false,
    checkMessage: '',
    starting: false,
    actionError: '',
    restartGaveUp: false,
  }),
  getters: {
    phase: ({ status }) => status?.state?.phase ?? 'idle',
    isActive(): boolean {
      return isActivePhase(this.phase)
    },
    // The pill in the header while an update runs.
    indicator(): UpdateIndicator | null {
      if (!this.status || !this.isActive) return null
      const { state } = this.status
      const restarting = state.phase === 'restarting'
      const percent = state.phase === 'downloading' ? downloadPercent(state.bytes, state.total) : null
      const target = state.version || this.status.latest || ''
      return {
        label: restarting ? 'Restarting…' : 'Updating',
        percent,
        restarting,
        ariaLabel: restarting
          ? `Restarting with ${target}. Show details`
          : `Updating to ${target}${percent === null ? '' : `, ${percent}%`}. Show details`,
      }
    },
    // What the dot on the Settings icon stands for; '' = no dot.
    attentionText(): string {
      if (!this.status || this.isActive) return ''
      if (this.phase === 'failed') return 'The update failed'
      if (this.phase === 'rolled_back') return 'The update was rolled back'
      if (this.phase === 'restart_required') return 'Restart Buggregator to finish the update'
      if (this.status.available && this.status.latest) return `Buggregator ${this.status.latest} is available`
      return ''
    },
    hasAttention(): boolean {
      return this.attentionText !== ''
    },
  },
  actions: {
    async init({ reload, listen = true }: InitOptions = {}) {
      if (reload) reloadPage = reload
      if (listen && !stopListening) {
        stopListening = onUpdateProgress((state) => this.applyState(state))
      }
      await this.load()
    },

    async load() {
      try {
        const status = await useUpdateRequests().getStatus()
        if (status === null) {
          this.supported = false
          this.status = null
          this.follow()
          return
        }
        this.setStatus(status)
      } catch (e) {
        // 401 before sign-in, a server that is away: try again later.
        console.warn('Update status could not be loaded', e)
      }
    },

    setStatus(status: UpdateStatus) {
      this.supported = true
      if (!this.loadedVersion) this.loadedVersion = status.current
      this.status = status
      this.follow()
    },

    applyState(state: UpdateState) {
      if (!this.status) return
      this.status = { ...this.status, state }
      this.follow()
    },

    // Keeps the page on track between socket messages: poll during a
    // download with the socket down, watch the server through a restart.
    follow() {
      const phase = this.phase

      if (phase === 'restarting') {
        stopPolling()
        if (!stopRestartWatch) {
          this.restartGaveUp = false
          const requests = useUpdateRequests()
          stopRestartWatch = startRestartWatch({
            fetchStatus: () => requests.getStatus(),
            loadedVersion: this.loadedVersion,
            onReload: () => {
              stopRestartWatch = null
              reloadPage()
            },
            onStatus: (status) => {
              stopRestartWatch = null
              this.setStatus(status)
            },
            onGiveUp: () => {
              stopRestartWatch = null
              this.restartGaveUp = true
            },
          })
        }
        return
      }

      stopWatching()

      if (this.isActive) {
        if (!pollTimer) {
          pollTimer = setInterval(() => {
            if (useConnectionStore().isConnectedWS) return
            this.load()
          }, POLL_INTERVAL)
        }
      } else {
        stopPolling()
      }
    },

    async check() {
      this.checking = true
      this.checkMessage = ''
      try {
        this.setStatus(await useUpdateRequests().check())
      } catch (e) {
        if (e instanceof UpdateApiError && e.status === 429) {
          this.checkMessage = `Checked less than a minute ago. Try again in ${e.retryAfter ? `${e.retryAfter} s` : 'a minute'}.`
        } else {
          this.checkMessage = `Could not check: ${describeError(e)}`
        }
      } finally {
        this.checking = false
      }
    },

    async start(version: string) {
      this.starting = true
      this.actionError = ''
      try {
        this.setStatus(await useUpdateRequests().start(version))
      } catch (e) {
        const status = e instanceof UpdateApiError ? e.status : 0
        if (status === 409) {
          this.actionError = 'An update is already running. Its progress is shown here.'
          await this.load()
        } else if (status === 400) {
          this.actionError = 'A newer release came out since the last check. Check again, then update.'
        } else if (status === 403) {
          this.actionError = `Updating from this page is off: ${describeError(e)}`
        } else {
          this.actionError = `The update did not start: ${describeError(e)}`
        }
      } finally {
        this.starting = false
      }
    },

    reload() {
      reloadPage()
    },

    // Ends timers and the socket listener (tests, hot reload).
    stop() {
      stopPolling()
      stopWatching()
      stopListening?.()
      stopListening = null
    },
  },
})
