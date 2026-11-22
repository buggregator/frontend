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
  SentryServiceMapEdgeTraces,
  SentryCounts,
  SentryFeedback,
  SentrySequence,
  CronMonitor,
  CronCheckIn,
  QueueJob,
  QueueJobDetail,
  QueueSummary,
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
      throw Object.assign(new Error(`Request failed: ${res.status} ${res.statusText}`), { status: res.status })
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

  // A trace's logs, all of them: no project and no header period, as for the
  // trace detail whose related_log_count names the tab (#6533 related-logs).
  const getTraceLogs = (traceId: string, page: number) =>
    fetchJSON<PaginatedResponse<SentryLog>>(
      `${BASE}/logs?${new URLSearchParams({ trace_id: traceId, page: String(page) }).toString()}`
    )

  const getMetrics = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryMetric>>(`${BASE}/metrics${qs ? `?${qs}` : ''}`)
  }

  // A trace's calls in time order; no project, as for the trace detail.
  const getTraceSequence = (traceId: string) =>
    fetchJSON<SentrySequence>(`${BASE}/traces/${traceId}/sequence`)

  // Services and the calls between them over the header period (#6533 B).
  const getServiceMap = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<SentryServiceMap>(`${BASE}/service-map${qs ? `?${qs}` : ''}`)
  }

  // Traces through one edge of the map, errors first; same scope as the map.
  const getServiceMapEdge = (params: { source: string; target: string; op_type?: string; limit?: string; offset?: string }) => {
    const qs = new URLSearchParams(withScope({ ...params })).toString()
    return fetchJSON<SentryServiceMapEdgeTraces>(`${BASE}/service-map/edge?${qs}`)
  }

  // All feedback in the project and period, newest first (#6604).
  const getFeedback = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<SentryFeedback>>(`${BASE}/feedback${qs ? `?${qs}` : ''}`)
  }

  // One error's feedback: no project or period, as for the error itself.
  const getEventFeedback = (eventId: string) =>
    fetchJSON<PaginatedResponse<SentryFeedback>>(
      `${BASE}/feedback?${new URLSearchParams({ event_id: eventId, limit: '50' }).toString()}`
    )

  // Cron monitors of the project with their recent runs (#6617). Not in a
  // period: a monitor lives until it is deleted.
  const getCronMonitors = (project = '') => {
    const qs = new URLSearchParams(withProject(project ? { project } : {})).toString()
    return fetchJSON<{ data: CronMonitor[] }>(`${REST_API_URL}/api/crons${qs ? `?${qs}` : ''}`)
  }

  // One monitor's runs, newest first; 404 for a slug the project has not.
  const getCronCheckIns = (slug: string, params: { project: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams({
      project: params.project,
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50)
    }).toString()
    return fetchJSON<PaginatedResponse<CronCheckIn>>(
      `${REST_API_URL}/api/crons/${encodeURIComponent(slug)}/checkins?${qs}`
    )
  }

  // Queue jobs of the project and period, newest last attempt first (#6713).
  // Filters: queue, job (class), status = ok | failed | retried.
  const getQueueJobs = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<PaginatedResponse<QueueJob>>(`${BASE}/queues/jobs${qs ? `?${qs}` : ''}`)
  }

  // Totals and queues of the period; 404 on a server older than #493.
  const getQueueSummary = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(withScope(params)).toString()
    return fetchJSON<QueueSummary>(`${BASE}/queues/summary${qs ? `?${qs}` : ''}`)
  }

  // One job with its attempts. No project or period, as for a trace: the id
  // is the message id, and a link from another project must still open.
  const getQueueJob = (id: string) =>
    fetchJSON<QueueJobDetail>(`${BASE}/queues/jobs/${encodeURIComponent(id)}`)

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
    getTraceLogs,
    getMetrics,
    getServiceMap,
    getServiceMapEdge,
    getTraceSequence,
    getCounts,
    getFeedback,
    getEventFeedback,
    getCronMonitors,
    getCronCheckIns,
    getQueueJobs,
    getQueueSummary,
    getQueueJob,
  }
}
