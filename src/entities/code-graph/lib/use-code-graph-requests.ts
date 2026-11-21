import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import type {
  CodeFileEntry,
  CodeGraph,
  CodeGraphRoots,
  CodeOutlineItem,
  CodeRootStatus,
  CodeSymbol,
  CodeSymbolDetail,
  CodeTopSymbol
} from '../types'

const BASE = `${REST_API_URL}/api/code`

// Server error codes: `unknown_root`, `not_found` (404), `bad_id`, `bad_level`,
// `bad_direction`, `root_required`, `path_required`, `file_and_line_required` (400).
export class CodeGraphApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message)
    this.name = 'CodeGraphApiError'
  }
}

export const isCodeNotFound = (e: unknown) => e instanceof CodeGraphApiError && e.status === 404

type Query = Record<string, string | number | undefined>

const qs = (params: Query) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : ''
}

export const useCodeGraphRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { ...init, headers: { 'X-Auth-Token': token.value } })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      throw new CodeGraphApiError(body?.error || `Request failed: ${res.status}`, res.status, body?.code || 'http_error')
    }
    return body as T
  }

  const root = (name: string) => `/roots/${encodeURIComponent(name)}`

  // An older server without the module answers 404: treated as «off».
  const getRoots = () =>
    request<CodeGraphRoots>('/roots').catch((e) => {
      if (isCodeNotFound(e)) return { enabled: false, snippets: false, roots: [] } as CodeGraphRoots
      throw e
    })
  const getRoot = (name: string) => request<CodeRootStatus>(root(name))
  const reindex = (name: string) => request<CodeRootStatus>(`${root(name)}/reindex`, { method: 'POST' })

  const search = (q: string, opts: { root?: string; kind?: string; limit?: number } = {}) =>
    request<{ symbols: CodeSymbol[] }>(`/search${qs({ q, ...opts })}`).then((r) => r?.symbols ?? [])
  const getSymbol = (id: number) => request<CodeSymbolDetail>(`/symbols/${id}`)
  const getCallers = (id: number, depth = 1, limit?: number) =>
    request<CodeGraph>(`/symbols/${id}/callers${qs({ depth, limit })}`)
  const getCallees = (id: number, depth = 1, limit?: number) =>
    request<CodeGraph>(`/symbols/${id}/callees${qs({ depth, limit })}`)

  const getFiles = (rootName: string, path = '') =>
    request<{ root: string; entries: CodeFileEntry[] }>(`/files${qs({ root: rootName, path })}`).then((r) => r?.entries ?? [])
  const getOutline = (rootName: string, path: string) =>
    request<{ symbols: CodeOutlineItem[] }>(`/files/outline${qs({ root: rootName, path })}`).then((r) => r?.symbols ?? [])

  // A drawable graph of a root; without a target, above `limit` the server
  // keeps the most connected nodes. `expand` (#6582): node ids drawn as what
  // they hold, the rest stays folded.
  const getGraph = (
    rootName: string,
    opts: { level?: 'symbol' | 'class' | 'package'; limit?: number; kinds?: string; expand?: string[] } = {}
  ) => {
    const { expand, ...rest } = opts
    return request<CodeGraph>(`/graph${qs({ root: rootName, ...rest, expand: expand?.length ? expand.join(',') : undefined })}`)
  }

  const getTop = (rootName: string, limit = 20) =>
    request<{ symbols: CodeTopSymbol[] }>(`/top${qs({ root: rootName, limit })}`).then((r) => r?.symbols ?? [])

  // The innermost function, method or type at a file and line; `file` may be
  // absolute (the server applies `code_graph.path_map`).
  const resolve = (file: string, line: number, rootName?: string) =>
    request<CodeSymbol>(`/resolve${qs({ file, line, root: rootName })}`)

  return { getRoots, getRoot, reindex, search, getSymbol, getCallers, getCallees, getFiles, getOutline, getGraph, getTop, resolve }
}
