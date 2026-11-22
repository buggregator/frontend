import { storeToRefs } from 'pinia'
import type { Monolog } from '@/entities/monolog'
import { REST_API_URL } from '@/shared/lib/io'
import { useEventsStore, useProfileStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import type { LogsHistogram } from './log-bars'
import { windowSeconds, type LogsFilters } from './logs-filters'

// The server's log endpoints (buggregator/server: facets, q, histogram).
// Every one takes the same filters: type=monolog, project, window, level,
// channel, trace (repeatable) and q.
export type FacetCount = { value: string; count: number }
export type LogsFacets = Record<string, FacetCount[]>

export class LogsLoadError extends Error {
  constructor(readonly status: number) {
    super(status ? `The server answered ${status}` : 'The server could not be reached')
    this.name = 'LogsLoadError'
  }
}

export const LOGS_PAGE_SIZE = 200
export const HISTOGRAM_BUCKET = 60

type Narrow = { search?: boolean }

// The query string for these filters; `search: false` leaves out the search
// and the level and channel picks (the whole window, for «of N lines»).
export const logsParams = (
  f: LogsFilters,
  project: string | undefined,
  { search = true }: Narrow = {}
) => {
  const params = new URLSearchParams({ type: 'monolog' })
  if (project) params.set('project', project)
  if (windowSeconds(f.window)) params.set('window', f.window)
  if (f.trace) params.append('trace', f.trace)
  if (search) {
    f.levels.forEach((l) => params.append('level', l))
    f.channels.forEach((c) => params.append('channel', c))
    if (f.q) params.set('q', f.q)
  }
  return params
}

export const useLogsApi = () => {
  const { token } = storeToRefs(useProfileStore())
  const { activeProjectKey } = storeToRefs(useEventsStore())

  const get = async <T>(path: string, params: URLSearchParams): Promise<T> => {
    let res: Response
    try {
      res = await fetch(`${REST_API_URL}${path}?${params}`, {
        headers: { 'X-Auth-Token': token.value }
      })
    } catch {
      throw new LogsLoadError(0)
    }
    if (!res.ok) throw new LogsLoadError(res.status)
    return (await res.json()) as T
  }

  const list = async (f: LogsFilters, offset = 0) => {
    const params = logsParams(f, activeProjectKey.value)
    params.set('limit', String(LOGS_PAGE_SIZE))
    if (offset) params.set('offset', String(offset))
    const body = await get<{ data?: ServerEvent<Monolog>[] }>('/api/events/preview', params)
    return Array.isArray(body?.data) ? body.data : []
  }

  // Whether the project has any log at all, whatever the window: «No logs
  // yet» only then.
  const hasAny = async () => {
    const params = new URLSearchParams({ type: 'monolog', limit: '1' })
    if (activeProjectKey.value) params.set('project', activeProjectKey.value)
    const body = await get<{ data?: unknown[] }>('/api/events/preview', params)
    return Array.isArray(body?.data) && body.data.length > 0
  }

  const facets = async (f: LogsFilters, narrow: Narrow = {}) => {
    const body = await get<{ data?: LogsFacets }>(
      '/api/events/facets',
      logsParams(f, activeProjectKey.value, narrow)
    )
    return body?.data ?? {}
  }

  const histogram = async (f: LogsFilters) => {
    const params = logsParams(f, activeProjectKey.value)
    params.set('bucket', String(HISTOGRAM_BUCKET))
    const body = await get<Partial<LogsHistogram>>('/api/events/histogram', params)
    return {
      bucket: Number(body?.bucket) || HISTOGRAM_BUCKET,
      data: Array.isArray(body?.data) ? body.data : []
    }
  }

  return { list, hasAny, facets, histogram }
}
