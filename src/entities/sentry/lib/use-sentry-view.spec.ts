import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { reloadSentryFilters, useSentryFilters } from './use-sentry-filters'
import { TRACE_VIEW_STORAGE, useSentryView, useTraceView } from './use-sentry-view'

const makeRouter = () =>
  createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { render: () => null } }] })

const withRouter = async <T>(router: Router, url: string, use: () => T) => {
  await router.push(url)
  await router.isReady()
  let api!: T
  mount(defineComponent({ setup: () => { api = use(); return () => h('div') } }), { global: { plugins: [router] } })
  return api
}

describe('useSentryView (#6543)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    reloadSentryFilters()
  })

  it('opens the view from the URL and remembers it', async () => {
    const v = await withRouter(makeRouter(), '/sentry/traces?view=map', () => useSentryView('traces'))
    expect(v.current.value).toBe('map')
    expect(useSentryFilters().tracesView).toBe('map')
  })

  it('without ?view uses the last view; an unknown one is ignored', async () => {
    useSentryFilters().exceptionsView = 'grouped'
    const v = await withRouter(makeRouter(), '/sentry/exceptions?view=bogus', () => useSentryView('exceptions'))
    expect(v.current.value).toBe('grouped')
  })

  it('a pick goes into the URL, so back returns to the previous view', async () => {
    const router = makeRouter()
    const v = await withRouter(router, '/sentry/traces?view=list', () => useSentryView('traces'))
    v.select('map')
    await nextTick()
    await new Promise((r) => setTimeout(r))
    expect(router.currentRoute.value.query.view).toBe('map')
    expect(v.current.value).toBe('map')
    v.select('nope')
    expect(v.current.value).toBe('map')
  })

  it('#6549: without ?view the current view goes into the URL, so Back from the map returns to it', async () => {
    useSentryFilters().tracesView = 'list'
    const router = makeRouter()
    const v = await withRouter(router, '/sentry/traces', () => useSentryView('traces'))
    await new Promise((r) => setTimeout(r))
    expect(router.currentRoute.value.query.view).toBe('list')
    v.select('map')
    await new Promise((r) => setTimeout(r))
    router.back()
    await new Promise((r) => setTimeout(r, 10))
    expect(router.currentRoute.value.query.view).toBe('list')
    expect(v.current.value).toBe('list')
  })

  it('?service= (the map «Traces» button) opens the list', async () => {
    useSentryFilters().tracesView = 'map'
    const v = await withRouter(makeRouter(), '/sentry/traces?service=checkout-api', () => useSentryView('traces'))
    expect(v.current.value).toBe('list')
  })
})

describe('useTraceView (#6543, trace page)', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts on the request view (#6715), then on the last graph view picked', async () => {
    const first = await withRouter(makeRouter(), '/sentry/traces/abc', () => useTraceView())
    expect(first.view.value).toBe('request')
    first.select('sequence')
    expect(window.localStorage.getItem(TRACE_VIEW_STORAGE)).toBe('sequence')

    const next = await withRouter(makeRouter(), '/sentry/traces/def', () => useTraceView())
    expect(next.view.value).toBe('sequence')
  })

  it('the URL wins; related lists are not remembered', async () => {
    window.localStorage.setItem(TRACE_VIEW_STORAGE, 'flame')
    const v = await withRouter(makeRouter(), '/sentry/traces/abc?view=graph', () => useTraceView())
    expect(v.view.value).toBe('graph')
    v.select('errors')
    expect(v.view.value).toBe('errors')
    expect(window.localStorage.getItem(TRACE_VIEW_STORAGE)).toBe('flame')
  })
})
