import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSentryPagedList } from './use-sentry-paged-list'

const deferred = <T>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

type Page = { data: string[], meta: { total: number } }

// Audit 1.14: the one copy of the paged list behind Sentry logs, metrics, traces and exceptions.
describe('useSentryPagedList', () => {
  it('asks for the current page and applies the answer', async () => {
    const items = ref<string[]>([])
    const pages: number[] = []
    const list = useSentryPagedList<Page>(
      async (page) => { pages.push(page); return { data: ['a'], meta: { total: 7 } } },
      (res) => { items.value = res.data },
    )
    list.page.value = 3
    await list.fetchList()
    expect(pages).toEqual([3])
    expect(items.value).toEqual(['a'])
    expect(list.total.value).toBe(7)
    expect(list.hasLoaded.value).toBe(true)
  })

  it('keeps only the last answer when requests overlap', async () => {
    const items = ref<string[]>([])
    const first = deferred<Page>()
    const second = deferred<Page>()
    const answers = [first.promise, second.promise]
    const list = useSentryPagedList<Page>(() => answers.shift() as Promise<Page>, (res) => { items.value = res.data })

    const a = list.fetchList()
    const b = list.fetchList()
    second.resolve({ data: ['new'], meta: { total: 1 } })
    await b
    expect(list.loading.value).toBe(false)
    first.resolve({ data: ['old'], meta: { total: 9 } })
    await a
    expect(items.value).toEqual(['new'])
    expect(list.total.value).toBe(1)
  })

  it('shows initial loading only before the first answer, and keeps a failure as text', async () => {
    const d = deferred<Page>()
    const list = useSentryPagedList<Page>(() => d.promise, () => {})
    const run = list.fetchList()
    expect(list.isInitialLoading.value).toBe(true)
    d.reject(Object.assign(new Error('Request failed'), { status: 500 }))
    await expect(run).resolves.toBeUndefined()
    expect(list.isInitialLoading.value).toBe(false)
    expect(list.hasLoaded.value).toBe(true)
    expect(list.error.value).toBe('The server answered 500.')
  })

  it('drops a stale failure when a newer request is under way', async () => {
    const first = deferred<Page>()
    const second = deferred<Page>()
    const answers = [first.promise, second.promise]
    const list = useSentryPagedList<Page>(() => answers.shift() as Promise<Page>, () => {})
    const a = list.fetchList()
    const b = list.fetchList()
    first.reject(new Error('late'))
    await a
    expect(list.error.value).toBe('')
    expect(list.loading.value).toBe(true)
    second.resolve({ data: [], meta: { total: 0 } })
    await b
  })
})
