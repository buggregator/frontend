import { storeToRefs } from 'pinia'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import type { UpdateErrorBody, UpdateStatus } from '../types'

// A refused request: status is the HTTP status; retryAfter (seconds) comes
// with 429 on a check made within a minute of the last one.
export class UpdateApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter?: number
  ) {
    super(message)
    this.name = 'UpdateApiError'
  }
}

export const createUpdateRequests = (getToken: () => string, base: string = REST_API_URL) => {
  const request = async (path: string, init: RequestInit = {}): Promise<UpdateStatus> => {
    const headers: Record<string, string> = { 'X-Auth-Token': getToken() || '' }
    if (init.method && init.method !== 'GET') headers['Content-Type'] = 'application/json'

    const response = await fetch(`${base}/api/update${path}`, { ...init, headers })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      const error = (body ?? {}) as UpdateErrorBody
      throw new UpdateApiError(
        error.message || `The server answered ${response.status}.`,
        response.status,
        typeof error.retry_after === 'number' ? error.retry_after : undefined
      )
    }

    return body as UpdateStatus
  }

  // null: an older server without the feature.
  const getStatus = () =>
    request('').catch((e) => {
      if (e instanceof UpdateApiError && e.status === 404) return null
      throw e
    })

  const check = () => request('/check', { method: 'POST', body: '{}' })

  const start = (version: string) => request('', { method: 'POST', body: JSON.stringify({ version }) })

  return { getStatus, check, start }
}

export type UpdateRequests = ReturnType<typeof createUpdateRequests>

// Reads the token at request time: a login changes it after this was made.
export const useUpdateRequests = (): UpdateRequests => {
  const { token } = storeToRefs(useProfileStore())
  return createUpdateRequests(() => token.value)
}
