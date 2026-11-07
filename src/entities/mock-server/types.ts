import type { ServerEvent } from '@/shared/types'

export type MockMethod = 'ANY' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export const MOCK_METHODS: MockMethod[] = ['ANY', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

// A rule as the server returns it (`GET /api/mocks`). `source: "config"` rules
// come from buggregator.yaml and are read-only.
export interface MockRule {
  id: string
  project: string
  name: string
  method: MockMethod
  path: string
  status: number
  headers: Record<string, string>
  body: string
  delay_ms: number
  enabled: boolean
  // Response template: body and header values are Go templates rendered per request.
  template?: boolean
  // Fake-data seed of a template: 0 = new data on every request.
  seed?: number
  position: number
  source: 'config' | 'api'
  read_only: boolean
  created_at?: string
  updated_at?: string
}

// What the editor sends on create / update.
export type MockRuleInput = Pick<
  MockRule,
  'project' | 'name' | 'method' | 'path' | 'status' | 'headers' | 'body' | 'delay_ms' | 'enabled'
> & {
  template: boolean
  seed: number
}

export type MockNearReason = 'disabled' | 'method' | 'project'

export interface MockNear {
  rule_id: string
  rule_name: string
  reason: MockNearReason
}

// The response the mock sent, stored on the captured HTTP dump (`payload.mock`).
export interface MockSnapshot {
  matched: boolean
  rule_id: string | null
  rule_name: string | null
  status: number
  headers: Record<string, string>
  body: string
  body_size: number
  body_truncated: boolean
  delay_ms: number
  near?: MockNear[]
  // Set when the rule's template failed while answering this request.
  template_error?: string
}

// The captured request: the part of the HTTP dump payload this page reads.
export interface MockHttpDump {
  received_at?: string
  host?: string
  request: {
    method: string
    uri: string
    headers: Record<string, string[]>
    body: string
    query: Record<string, unknown>
  }
  mock: MockSnapshot
}

export type MockRequestEvent = ServerEvent<MockHttpDump>

// Field → message, as in the server's 422 `errors`.
export type MockRuleErrors = Partial<Record<keyof MockRuleInput, string>>
