import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { REST_API_URL } from '@/shared/lib/io'
import { describeLoadError } from '@/shared/lib/io/request-result'
import { useProfileStore } from '@/shared/stores'

// One record of GET /api/audit (#6771), newest first.
export type AuditEntry = {
  id: number
  at: string
  user_id: string
  user: string
  action: string
  target: string
  status: number
  ip: string
}

type AuditState = 'loading' | 'ready' | 'error' | 'forbidden'

const PAGE = 100

class AuditError extends Error {
  constructor(readonly status: number) {
    super(`The server answered ${status}.`)
  }
}

// The audit log, a page at a time (`before` = the last id shown).
export const createAuditLog = (getToken: () => string, base: string = REST_API_URL, limit = PAGE) => {
  const state = ref<AuditState>('loading')
  const error = ref('')
  const rows = ref<AuditEntry[]>([])
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const moreError = ref('')

  const fetchPage = async (before?: number): Promise<AuditEntry[]> => {
    const query = before ? `limit=${limit}&before=${before}` : `limit=${limit}`
    const response = await fetch(`${base}/api/audit?${query}`, {
      headers: { 'X-Auth-Token': getToken() || '' },
    })
    if (!response.ok) throw new AuditError(response.status)

    const body = (await response.json().catch(() => null)) as { data?: unknown } | null
    // Auth off or an older server: the web page comes back, not a log.
    if (!Array.isArray(body?.data)) throw new Error('The server does not keep an audit log.')
    const page = body.data as AuditEntry[]
    hasMore.value = page.length === limit
    return page
  }

  const load = async () => {
    state.value = 'loading'
    error.value = ''
    moreError.value = ''
    try {
      rows.value = await fetchPage()
      state.value = 'ready'
    } catch (e) {
      rows.value = []
      hasMore.value = false
      state.value = (e as AuditError).status === 403 ? 'forbidden' : 'error'
      error.value = describeLoadError(e)
    }
  }

  const loadMore = async () => {
    const last = rows.value[rows.value.length - 1]
    if (!last || loadingMore.value) return

    loadingMore.value = true
    moreError.value = ''
    try {
      rows.value = [...rows.value, ...(await fetchPage(last.id))]
    } catch (e) {
      moreError.value = describeLoadError(e)
    } finally {
      loadingMore.value = false
    }
  }

  return { state, error, rows, hasMore, loadingMore, moreError, load, loadMore }
}

// Reads the token at request time.
export const useAuditLog = () => {
  const { token } = storeToRefs(useProfileStore())
  return createAuditLog(() => token.value)
}
