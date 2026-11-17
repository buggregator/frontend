import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import {
  activeSentryFilters,
  reloadSentryFilters,
  resetSentryFilters,
  useSentryFilters
} from './use-sentry-filters'

describe('useSentryFilters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    reloadSentryFilters()
  })

  it('starts on the defaults', () => {
    expect({ ...useSentryFilters() }).toEqual({
      exceptionsView: 'timeline',
      exceptionsLevel: '',
      tracesView: 'list',
      logsLevel: '',
      metricsType: '',
      metricsName: ''
    })
  })

  it('remembers a choice for the next page load', async () => {
    const f = useSentryFilters()
    f.logsLevel = 'error'
    f.tracesView = 'map'
    await nextTick()
    f.logsLevel = ''
    f.tracesView = 'list'
    window.localStorage.setItem('sentry_logs_level', 'error')
    window.localStorage.setItem('sentry_traces_view_mode', 'map')
    reloadSentryFilters()

    expect(f.logsLevel).toBe('error')
    expect(f.tracesView).toBe('map')
  })

  it('keeps reading the view keys saved before the header (grouped / map)', () => {
    window.localStorage.setItem('sentry_exceptions_view_mode', 'grouped')
    window.localStorage.setItem('sentry_traces_view_mode', 'bogus')
    reloadSentryFilters()

    expect(useSentryFilters().exceptionsView).toBe('grouped')
    expect(useSentryFilters().tracesView).toBe('list')
  })

  it('the badge counts narrowing filters only, not the view mode', () => {
    const f = useSentryFilters()
    f.exceptionsView = 'grouped'
    expect(activeSentryFilters('exceptions')).toBe(0)
    f.exceptionsLevel = 'error'
    expect(activeSentryFilters('exceptions')).toBe(1)
    f.metricsType = 'gauge'
    f.metricsName = '  '
    expect(activeSentryFilters('metrics')).toBe(1)
    f.metricsName = 'order'
    expect(activeSentryFilters('metrics')).toBe(2)
    expect(activeSentryFilters('traces')).toBe(0)
  })

  it('Reset clears the tab’s filters and keeps its view mode', () => {
    const f = useSentryFilters()
    f.exceptionsView = 'grouped'
    f.exceptionsLevel = 'fatal'
    f.logsLevel = 'warn'
    resetSentryFilters('exceptions')

    expect(f.exceptionsLevel).toBe('')
    expect(f.exceptionsView).toBe('grouped')
    expect(f.logsLevel).toBe('warn')
  })
})
