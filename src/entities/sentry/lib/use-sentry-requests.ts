import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useEventsStore, useProfileStore } from '@/shared/stores'
import type {
  PaginatedResponse,
  SentryExceptionItem,
  SentryErrorGroup,
  SentryExceptionDetail,
  SentryTrace,
  SentryTraceDetail,
  SentryLog,
  SentryMetric,
  SentryServiceMap,
  SentryCounts,
} from '../types'

const BASE = `${REST_API_URL}/api/sentry`

export const useSentryRequests = () => {
  const { token } = storeToRefs(useProfileStore())
  const { activeProjectKey, period } = storeToRefs(useEventsStore())
  const headers = () => ({ 'X-Auth-Token': token.value })

  // Every Sentry list takes the selected project and the period (the server
  // stores traces, logs and metrics per project since buggregator/server #365).
  const withProject = (params: Record<string, string> = {}): Record<string, string> => {
    const scoped = { ...params }
    if (activeProjectKey.value && !scoped.project) {
      scoped.project = activeProjectKey.value
    }
    return scoped
  }

  const withScope = (params: Record<string, string> = {}): Record<string, string> => {
    const scoped = withProject(params)
    if (period.value && !scoped.window && !scoped.from && !scoped.to) {
      scoped.window = period.value
    }
    return scoped
  }

  const fetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  const getExceptions = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryExceptionItem>>(`${BASE}/exceptions${qs ? `?${qs}` : ''}`)
  }

  const getExceptionsGrouped = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ ...withScope(params), grouped: 'true' }).toString()
    return fetchJSON<PaginatedResponse<SentryErrorGroup>>(`${BASE}/exceptions?${qs}`)
  }

  const getExceptionDetail = (id: string) =>
    fetchJSON<SentryExceptionDetail>(`${BASE}/exceptions/${id}`)

  const getTraces = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryTrace>>(`${BASE}/traces${qs ? `?${qs}` : ''}`)
  }

  // No project: a trace can span several projects, and with ?project the
  // server answers 404 when the trace has no transaction in that project.
  const getTraceDetail = (traceId: string) =>
    fetchJSON<SentryTraceDetail>(`${BASE}/traces/${traceId}`)

  const getLogs = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryLog>>(`${BASE}/logs${qs ? `?${qs}` : ''}`)
  }

  const getMetrics = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryMetric>>(`${BASE}/metrics${qs ? `?${qs}` : ''}`)
  }

  const getServiceMap = (windowMinutes?: number) => {
    const qs = new URLSearchParams(
      withProject(windowMinutes ? { window: String(windowMinutes) } : {})
    ).toString()
    return fetchJSON<SentryServiceMap>(`${BASE}/service-map${qs ? `?${qs}` : ''}`)
  }

  // The badges label the lists, so they take the same scope.
  const getCounts = () => {
    const qs = new URLSearchParams(withScope()).toString()
    return fetchJSON<SentryCounts>(`${BASE}/counts${qs ? `?${qs}` : ''}`)
  }

  return {
    getExceptions,
    getExceptionsGrouped,
    getExceptionDetail,
    getTraces,
    getTraceDetail,
    getLogs,
    getMetrics,
    getServiceMap,
    getCounts,
  }
}
