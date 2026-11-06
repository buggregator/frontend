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

  // The project and the period are mixed into every sentry request.
  //
  // Neither was sent before, so the project picked in the sidebar had no effect
  // on the exceptions list: the grouped view always showed every project at once
  // (in the access log the request is just "exceptions?page=1&grouped=true",
  // with no parameters at all).
  const withScope = (params: Record<string, string> = {}): Record<string, string> => {
    const scoped = { ...params }
    if (activeProjectKey.value && !scoped.project) {
      scoped.project = activeProjectKey.value
    }
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

  const getTraceDetail = (traceId: string) =>
    fetchJSON<SentryTraceDetail>(`${BASE}/traces/${traceId}`)

  const getLogs = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryLog>>(`${BASE}/logs${qs ? `?${qs}` : ''}`)
  }

  const getMetrics = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return fetchJSON<PaginatedResponse<SentryMetric>>(`${BASE}/metrics${qs ? `?${qs}` : ''}`)
  }

  const getServiceMap = (windowMinutes?: number) => {
    const qs = windowMinutes ? `?window=${windowMinutes}` : ''
    return fetchJSON<SentryServiceMap>(`${BASE}/service-map${qs}`)
  }

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
