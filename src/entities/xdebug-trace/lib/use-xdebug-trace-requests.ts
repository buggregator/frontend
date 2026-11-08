import { storeToRefs } from 'pinia'
import { REST_API_URL, describeLoadError } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import type { EventId } from '@/shared/types'
import type { XdebugTracePage, XdebugTraceSummaryAnswer } from '../types'
import type { TreeQuery } from './use-trace-tree'

// The server answers at most 1000 nodes per request.
export const TRACE_PAGE_LIMIT = 200

// Trace API (server modules/xdebugtrace, behind auth). Every call throws an
// Error whose message says why, so the page can show it.
export const useXdebugTraceRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const get = async <T>(id: EventId, part: string, params: Record<string, string | number | undefined>): Promise<T> => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value))
    })
    const qs = query.toString()
    try {
      const response = await fetch(
        `${REST_API_URL}/api/xdebug-traces/${id}/${part}${qs ? `?${qs}` : ''}`,
        { headers: { 'X-Auth-Token': token.value } },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw Object.assign(new Error(body?.error || response.statusText), { status: response.status })
      }
      return await response.json() as T
    } catch (e) {
      throw new Error(describeLoadError(e))
    }
  }

  return {
    getSummary: (id: EventId) => get<XdebugTraceSummaryAnswer>(id, 'summary', {}),
    getTree: (id: EventId, query: TreeQuery) =>
      get<XdebugTracePage>(id, 'tree', { ...query, limit: TRACE_PAGE_LIMIT }),
    search: (id: EventId, q: string, from?: number) =>
      get<XdebugTracePage>(id, 'search', { q, from, limit: TRACE_PAGE_LIMIT }),
  }
}
