import { ref } from 'vue'

export interface MetricsData {
  events: {
    received: Record<string, number>
    stored: Record<string, number>
    errors: number
  }
  connections: {
    websocket: number
    tcp: Record<string, number>
  }
  http: {
    requests_total: number
  }
  webhooks: {
    sent: number
    failed: number
  }
}

// loading: first request in flight. off: the server has no metrics route
// (metrics.enabled is false, so the SPA answers). error: the first load failed.
export type MetricsState = 'loading' | 'ready' | 'off' | 'error'

type Fetcher = () => Promise<Response>

export const useMetrics = (fetcher: Fetcher) => {
  const state = ref<MetricsState>('loading')
  const metrics = ref<MetricsData | null>(null)
  const error = ref('')
  // A refresh failed after a good load: the numbers shown are the last known.
  const stale = ref(false)

  const fail = (message: string) => {
    error.value = message
    if (metrics.value) {
      stale.value = true
    } else {
      state.value = 'error'
    }
  }

  const load = async () => {
    let res: Response
    try {
      res = await fetcher()
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e))
      return
    }

    const isJson = (res.headers.get('Content-Type') || '').includes('application/json')
    if (res.status === 404 || (res.ok && !isJson)) {
      metrics.value = null
      stale.value = false
      state.value = 'off'
      return
    }
    if (!res.ok) {
      fail(`The server answered ${res.status}`)
      return
    }

    try {
      metrics.value = (await res.json()) as MetricsData
    } catch {
      fail('The server sent metrics that could not be read')
      return
    }
    error.value = ''
    stale.value = false
    state.value = 'ready'
  }

  return { state, metrics, error, stale, load }
}
