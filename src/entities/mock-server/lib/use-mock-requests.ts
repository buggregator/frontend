import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useEventsStore, useProfileStore } from '@/shared/stores'
import type {
  MockHelpers,
  MockPreviewRequest,
  MockPreviewResult,
  MockRequestEvent,
  MockRule,
  MockRuleErrors,
  MockRuleInput
} from '../types'

const BASE = `${REST_API_URL}/api/mocks`

// How many captured requests the page loads; live ones are added on top.
export const MOCK_REQUESTS_LIMIT = 200

export class MockApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: MockRuleErrors = {}
  ) {
    super(message)
    this.name = 'MockApiError'
  }
}

export const useMockRequests = () => {
  const { token } = storeToRefs(useProfileStore())
  const { activeProjectKey } = storeToRefs(useEventsStore())

  const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = { 'X-Auth-Token': token.value }
    if (init.body) headers['Content-Type'] = 'application/json'

    const res = await fetch(url, { ...init, headers })
    const body = await res.json().catch(() => null)

    if (!res.ok) {
      throw new MockApiError(body?.message || `Request failed: ${res.status}`, res.status, body?.errors || {})
    }
    return body as T
  }

  const send = <T>(method: string, url: string, payload?: unknown) =>
    request<T>(url, { method, body: payload === undefined ? undefined : JSON.stringify(payload) })

  const getRules = () => request<{ data: MockRule[] }>(BASE).then(({ data }) => data)

  const getRequests = () => {
    const qs = new URLSearchParams({ project: activeProjectKey.value || '', limit: String(MOCK_REQUESTS_LIMIT) })
    return request<{ data: MockRequestEvent[] }>(`${BASE}/requests?${qs}`).then(({ data }) => data)
  }

  const createRule = (rule: MockRuleInput) => send<MockRule>('POST', BASE, rule)
  const updateRule = (id: string, rule: MockRuleInput) => send<MockRule>('PUT', `${BASE}/${id}`, rule)
  const deleteRule = (id: string) => send<{ status: boolean }>('DELETE', `${BASE}/${id}`)
  const reorderRules = (ids: string[]) =>
    send<{ data: MockRule[] }>('POST', `${BASE}/order`, { ids }).then(({ data }) => data)

  const getHelpers = () => request<MockHelpers>(`${BASE}/helpers`)
  const preview = (rule: MockRuleInput, sample: MockPreviewRequest) =>
    send<MockPreviewResult>('POST', `${BASE}/preview`, { rule, request: sample })

  return { getRules, getRequests, createRule, updateRule, deleteRule, reorderRules, getHelpers, preview }
}
