import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import type { MockFake, MockHelper, MockHelpers, MockPreviewResult, MockRuleInput } from '../types'
import { parseHeaderLines } from './mock-template'
import { MockApiError, useMockRequests } from './use-mock-requests'
import type { LoadState } from './use-mock-traffic'

// A request path the rule's path matches: {params} → 42, a trailing * → a/b.png.
export const samplePath = (path: string): string =>
  (path || '/').replace(/\{[^}]+\}/g, '42').replace(/\*$/, 'a/b.png')

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
      problemField.value = ''
      const fields = e instanceof MockApiError ? e.fields : {}
      const rule = fields.body || fields.headers
      if (!rule && fields['request.path']) {
        problem.value = `Sample path ${fields['request.path']}`
        problemField.value = 'path'
        return
      }
      problem.value =
        rule || Object.values(fields)[0] || (e instanceof Error ? e.message : 'Preview failed.')
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
