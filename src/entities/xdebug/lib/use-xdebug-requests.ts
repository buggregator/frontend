import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import type {
  XdebugAgentCall,
  XdebugBreakpoint,
  XdebugConfig,
  XdebugContext,
  XdebugFrame,
  XdebugSession,
  XdebugSource,
  XdebugVar
} from '../types'

const BASE = `${REST_API_URL}/api/xdebug`

// Server error codes the page reacts to: `not_paused` (the script runs on),
// `eval_disabled`, `not_found`, `xdebug_error`, `timeout`, `session_live`.
export class XdebugApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message)
    this.name = 'XdebugApiError'
  }
}

export const isNotPaused = (e: unknown) => e instanceof XdebugApiError && e.code === 'not_paused'

export type FrameRef = { frame: number; context?: number }

export const useXdebugRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = { 'X-Auth-Token': token.value }
    if (init.body) headers['Content-Type'] = 'application/json'

    const res = await fetch(`${BASE}${path}`, { ...init, headers })
    if (res.status === 204) return undefined as T

    const body = await res.json().catch(() => null)
    if (!res.ok) {
      throw new XdebugApiError(body?.error || `Request failed: ${res.status}`, res.status, body?.code || 'http_error')
    }
    return body as T
  }

  const session = (id: string) => `/sessions/${encodeURIComponent(id)}`
  const qs = (params: Record<string, string | number>) =>
    new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

  const getConfig = () => request<XdebugConfig>('')
  const getSessions = () => request<XdebugSession[]>('/sessions').then((list) => list ?? [])
  const dismissSession = (id: string) => request<void>(session(id), { method: 'DELETE' })

  const getStack = (id: string) => request<XdebugFrame[]>(`${session(id)}/stack`)
  const getContexts = (id: string, { frame }: FrameRef) =>
    request<XdebugContext[]>(`${session(id)}/contexts?${qs({ frame })}`)
  const getVariables = (id: string, { frame, context = 0 }: FrameRef) =>
    request<XdebugVar[]>(`${session(id)}/variables?${qs({ frame, context })}`).then((list) => list ?? [])
  const getProperty = (id: string, name: string, { frame, context = 0 }: FrameRef, page = 0) =>
    request<XdebugVar>(`${session(id)}/property?${qs({ name, frame, context, page })}`)
  const getSource = (id: string, file: string, begin: number, end: number) =>
    request<XdebugSource>(`${session(id)}/source?${qs({ file, begin, end })}`)
  const getBreakpoints = (id: string) =>
    request<XdebugBreakpoint[]>(`${session(id)}/breakpoints`).then((list) => list ?? [])
  const getAgentLog = (id: string) =>
    request<XdebugAgentCall[]>(`${session(id)}/agent-log`).then((list) => list ?? [])
  const evaluate = (id: string, expression: string) =>
    request<XdebugVar>(`${session(id)}/eval`, { method: 'POST', body: JSON.stringify({ expression }) })

  return {
    getConfig,
    getSessions,
    dismissSession,
    getStack,
    getContexts,
    getVariables,
    getProperty,
    getSource,
    getBreakpoints,
    getAgentLog,
    evaluate
  }
}

export type XdebugRequests = ReturnType<typeof useXdebugRequests>
