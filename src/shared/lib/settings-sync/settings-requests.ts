import { REST_API_URL } from '../io/constants'
import type { SettingsRequests } from './settings-sync'

// A refused request; status is the HTTP status (describeLoadError reads it).
export class SettingsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'SettingsApiError'
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// GET/PUT /api/me/settings (#6771). Reads the token at request time.
export const createSettingsRequests = (
  getToken: () => string,
  base: string = REST_API_URL
): SettingsRequests => {
  const request = async (init: RequestInit = {}): Promise<Record<string, unknown>> => {
    const headers: Record<string, string> = { 'X-Auth-Token': getToken() || '' }
    if (init.body) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${base}/api/me/settings`, { ...init, headers })
    const body: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      const message = isObject(body) && typeof body.message === 'string' ? body.message : ''
      throw new SettingsApiError(message || `The server answered ${response.status}.`, response.status)
    }

    return isObject(body) && isObject(body.data) ? body.data : {}
  }

  return {
    get: () => request(),
    put: async (changes) => {
      await request({ method: 'PUT', body: JSON.stringify(changes) })
    },
  }
}
