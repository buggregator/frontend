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
  source: 'config' | 'api' | 'mcp'
  read_only: boolean
  // The OpenAPI import that made the rule ("" = none). A re-import of the
  // group replaces its stored rules.
  group?: string
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

// GET /api/mocks/helpers: template functions and fake-data generators.
export type MockHelperGroup = 'request' | 'data' | 'output' | 'fake'

export interface MockHelper {
  name: string
  group: MockHelperGroup
  usage: string
  description: string
  example: string
  result: string
}

export interface MockFakeParam {
  name: string
  type: string
  optional: boolean
  default?: string
  options?: string[]
}

export interface MockFake {
  name: string
  category: string
  description: string
  example: string
  output: string
  params: MockFakeParam[]
}

export interface MockHelpers {
  helpers: MockHelper[]
  fake: MockFake[]
}

// POST /api/mocks/preview: an unsaved rule answered for a sample request.
export interface MockPreviewRequest {
  method: string
  path: string
  headers: Record<string, string>
  body: string
}

export interface MockPreviewResult {
  status: number
  headers: Record<string, string>
  body: string
  matched: boolean
  // A template that failed while rendering: "mock template: …", status 500.
  error: string | null
}

// POST /api/mocks/import/openapi: exactly one of spec / url. base_path absent
// = the path of the spec's servers[0].url; "" = no prefix.
export interface MockOpenAPIImport {
  spec?: string
  url?: string
  project?: string
  group?: string
  base_path?: string
}

export type MockOpenAPIErrors = Partial<Record<'spec' | 'url' | 'project' | 'group' | 'base_path', string>>

export interface MockOpenAPISkip {
  method: string
  path: string
  reason: string
}

export interface MockOpenAPIResult {
  group: string
  title: string
  rules: MockRule[]
  skipped: MockOpenAPISkip[]
}
