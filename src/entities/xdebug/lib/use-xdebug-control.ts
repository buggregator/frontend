import { computed, ref, watch, type Ref } from 'vue'
import type { XdebugCommand, XdebugSession } from '../types'
import { XdebugApiError, type XdebugRequests } from './use-xdebug-requests'

export const COMMAND_LABEL: Record<XdebugCommand, string> = {
  run: 'Continue',
  'step-over': 'Step over',
  'step-into': 'Step into',
  'step-out': 'Step out',
  detach: 'Release',
  stop: 'Stop'
}

const ENDED = ['stopping', 'stopped', 'detached']

const failureText = (command: XdebugCommand, e: unknown) => {
  const what = `${COMMAND_LABEL[command]} failed`
  if (e instanceof XdebugApiError && e.code === 'ide_attached') return `${what}: an IDE drives this session. Step in your IDE.`
  if (e instanceof XdebugApiError && e.code === 'not_paused') {
    return ENDED.includes(e.state ?? '')
      ? `${what}: the script already ended (Xdebug closed the connection).`
      : `${what}: the script is not paused.`
  }
  return `${what}: ${e instanceof Error ? e.message : String(e)}`
}

// m:ss until the deadline, never below zero.
const countdown = (deadline: string, now: number) => {
  const left = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
}

// Controls of the selected session when Buggregator drives it (no IDE):
// continue, steps, stop and release. One command at a time; the reply only
// says the script runs (`onInfo` puts it into the list), the next pause comes
// as `session.status`. `now` ticks the idle countdown.
export const useXdebugControl = (
  api: Pick<XdebugRequests, 'control'>,
  session: Ref<XdebugSession | null>,
  now: Ref<number>,
  onInfo: (info: XdebugSession) => void
) => {
  const pending = ref<XdebugCommand | null>(null)
  const error = ref('')

  const drivenHere = computed(() => session.value?.driver === 'here')
  const drivenByIde = computed(() => session.value?.driver === 'ide')
  const canControl = computed(() => drivenHere.value && session.value?.state === 'break' && !pending.value)

  const send = async (command: XdebugCommand) => {
    const s = session.value
    if (!s || !canControl.value) return
    pending.value = command
    error.value = ''
    try {
      onInfo(await api.control(s.id, command))
    } catch (e) {
      if (session.value?.id === s.id) error.value = failureText(command, e)
    } finally {
      pending.value = null
    }
  }

  const dismissError = () => {
    error.value = ''
  }

  watch(() => session.value?.id, dismissError)

  const idleLeft = computed(() => {
    const deadline = session.value?.idle_deadline
    return deadline ? countdown(deadline, now.value) : ''
  })

  const lastBy = computed(() => {
    const s = session.value
    if (s?.last_continuation_by === 'ui') return 'You'
    if (s?.last_continuation_by === 'agent') return s.last_continuation_agent ? `agent ${s.last_continuation_agent}` : 'an agent'
    return ''
  })

  return { pending, error, drivenHere, drivenByIde, canControl, send, dismissError, idleLeft, lastBy }
}

export type XdebugControl = ReturnType<typeof useXdebugControl>
