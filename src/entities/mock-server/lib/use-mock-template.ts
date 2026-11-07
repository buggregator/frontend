import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import type { MockFake, MockHelper, MockHelpers, MockPreviewResult, MockRuleInput } from '../types'
import { parseHeaderLines } from './mock-template'
import { MockApiError, useMockRequests } from './use-mock-requests'
import type { LoadState } from './use-mock-traffic'

// A request path the rule's path matches: {params} → 42, a trailing * → a/b.png.
// Always starts with / (a rule path typed without it is the rule's problem).
export const samplePath = (path: string): string =>
  `/${path.replace(/^\/+/, '')}`.replace(/\{[^}]+\}/g, '42').replace(/\*$/, 'a/b.png')

// The helper list is the same for every rule: one request per page load.
let cached: Promise<MockHelpers> | null = null
const helpersState = ref<LoadState>('loading')
const helpers = shallowRef<MockHelper[]>([])
const fakes = shallowRef<MockFake[]>([])

export const resetMockHelpersCache = () => {
  cached = null
  helpersState.value = 'loading'
  helpers.value = []
  fakes.value = []
}

export const useMockHelpers = () => {
  const api = useMockRequests()

  const load = async () => {
    if (!cached) {
      helpersState.value = 'loading'
      cached = api.getHelpers()
    }
    try {
      const data = await cached
      helpers.value = data.helpers || []
      fakes.value = data.fake || []
      helpersState.value = 'ready'
    } catch {
      cached = null
      helpersState.value = 'error'
    }
  }

  return { helpers, fakes, state: helpersState, load }
}

export type PreviewSample = { method: string; path: string; headers: string; body: string }

// Field names of a rejected rule, as the editor labels them.
const RULE_FIELDS: Record<string, string> = {
  path: 'Rule path',
  method: 'Rule method',
  status: 'Status',
  delay_ms: 'Delay',
  seed: 'Seed',
  project: 'Project',
  name: 'Name',
  'request.path': 'Sample path',
}

// A rejected preview in words: template errors (body, headers) name
// themselves; other fields get the editor's label in front.
const problemText = (e: unknown): string => {
  const fields = e instanceof MockApiError ? e.fields : {}
  const rule = fields.body || fields.headers
  if (rule) return rule
  const [key, text] = Object.entries(fields)[0] || []
  if (key && text) return `${RULE_FIELDS[key] || key} ${text}`
  return e instanceof Error ? e.message : 'Preview failed.'
}

const RERUN_MS = 400

// The rule as edited (not saved) answered for a sample request. After the
// first run it runs again by itself when the rule or the sample changes.
export const useMockPreview = (rule: Ref<MockRuleInput>) => {
  const api = useMockRequests()

  const sample = ref<PreviewSample>({
    method: rule.value.method === 'ANY' ? 'GET' : rule.value.method,
    path: samplePath(rule.value.path),
    headers: '',
    body: '',
  })
  const result = ref<MockPreviewResult | null>(null)
  // Why there is no result: the server's message for a rule it rejects.
  const problem = ref('')
  // The sample field the problem is about ('' = the rule itself).
  const problemField = ref<'path' | ''>('')
  const pending = ref(false)
  const started = ref(false)

  // Only the newest run may write: an older, slower answer is dropped.
  let runs = 0

  const run = async () => {
    const id = ++runs
    started.value = true
    // Under /mock the server takes any sample path: check it here.
    if (!sample.value.path.startsWith('/')) {
      result.value = null
      problem.value = 'Sample path must start with /'
      problemField.value = 'path'
      pending.value = false
      return
    }
    pending.value = true
    try {
      const answer = await api.preview(rule.value, {
        method: sample.value.method,
        // the field shows the path under /mock; the server strips that prefix
        path: `/mock${sample.value.path}`,
        headers: parseHeaderLines(sample.value.headers),
        body: sample.value.body,
      })
      if (id !== runs) return
      result.value = answer
      problem.value = ''
      problemField.value = ''
    } catch (e) {
      if (id !== runs) return
      result.value = null
      const fields = e instanceof MockApiError ? e.fields : {}
      problemField.value = fields['request.path'] && !fields.body && !fields.headers ? 'path' : ''
      problem.value = problemText(e)
    } finally {
      if (id === runs) pending.value = false
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  watch(
    [rule, sample],
    () => {
      if (!started.value) return
      clearTimeout(timer)
      timer = setTimeout(run, RERUN_MS)
    },
    { deep: true }
  )

  onScopeDispose(() => clearTimeout(timer))

  return { sample, result, problem, problemField, pending, run }
}
