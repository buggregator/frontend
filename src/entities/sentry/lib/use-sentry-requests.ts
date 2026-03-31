import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import type {
  PaginatedResponse,
  SentryExceptionItem,
  SentryErrorGroup,
  SentryExceptionDetail,
  SentryTrace,
  SentryTraceDetail,
  SentryLog,
  SentryServiceMap,
  SentryCounts,
} from '../types'

const BASE = `${REST_API_URL}/api/sentry`

export const useSentryRequests = () => {
  const { token } = storeToRefs(useProfileStore())
  const headers = () => ({ 'X-Auth-Token': token.value })

  const fetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  const getExceptions = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return fetchJSON<PaginatedResponse<SentryExceptionItem>>(`${BASE}/exceptions${qs ? `?${qs}` : ''}`)
  }

  const getExceptionsGrouped = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ ...params, grouped: 'true' }).toString()
    return fetchJSON<PaginatedResponse<SentryErrorGroup>>(`${BASE}/exceptions?${qs}`)
  }

  const getExceptionDetail = (id: string) =>
    fetchJSON<SentryExceptionDetail>(`${BASE}/exceptions/${id}`)

  const getTraces = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return fetchJSON<PaginatedResponse<SentryTrace>>(`${BASE}/traces${qs ? `?${qs}` : ''}`)
  }

  const getTraceDetail = (traceId: string) =>
    fetchJSON<SentryTraceDetail>(`${BASE}/traces/${traceId}`)

  const getLogs = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return fetchJSON<PaginatedResponse<SentryLog>>(`${BASE}/logs${qs ? `?${qs}` : ''}`)
  }

  const getServiceMap = (windowMinutes?: number) => {
    const qs = windowMinutes ? `?window=${windowMinutes}` : ''
    return fetchJSON<SentryServiceMap>(`${BASE}/service-map${qs}`)
  }

  const getCounts = () =>
    fetchJSON<SentryCounts>(`${BASE}/counts`)

  return {
    getExceptions,
    getExceptionsGrouped,
    getExceptionDetail,
    getTraces,
    getTraceDetail,
    getLogs,
    getServiceMap,
    getCounts,
  }
}
