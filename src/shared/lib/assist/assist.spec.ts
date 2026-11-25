import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { EventTypes, type ServerEvent } from '../../types'
import { eventContextTitle } from './event-title'
import {
  type PageContext,
  clipBytes,
  currentPageContext,
  providePageContext,
  resetPageContexts
} from './page-context'
import { pageKey, pageText } from './page-text'
import { ASSIST_WIDTH, clampAssistWidth, closeAssist, isAssistOpen, openAssist, toggleAssist } from './panel-state'

const ev = (type: string, payload: unknown, uuid = 'aaaaaaaa-1111'): ServerEvent<unknown> => ({
  uuid,
  type,
  payload,
  project: 'shop',
  timestamp: 1764000000
})

const page = (key: string): PageContext => ({ kind: 'page', key, title: key })

describe('page context', () => {
  afterEach(resetPageContexts)

  it('the latest one wins; the layout fallback only when no page gives one', async () => {
    const fallback = providePageContext(() => page('/layout'), { fallback: true })
    expect(currentPageContext.value?.key).toBe('/layout')

    const loaded = ref(false)
    const remove = providePageContext(() => (loaded.value ? { kind: 'event', key: 'u1', title: 't' } : null))
    // Set up after the page (it wraps it), still a fallback.
    providePageContext(() => page('/layout-2'), { fallback: true })
    expect(currentPageContext.value?.key).toBe('/layout-2')

    loaded.value = true
    expect(currentPageContext.value?.key).toBe('u1')

    remove()
    fallback()
    expect(currentPageContext.value?.key).toBe('/layout-2')
  })

  it('goes away with the component that gave it', async () => {
    const Child = defineComponent({
      setup() {
        providePageContext(() => page('/child'))
        return () => h('i')
      }
    })
    const w = mount(Child)
    expect(currentPageContext.value?.key).toBe('/child')
    w.unmount()
    await nextTick()
    expect(currentPageContext.value).toBeNull()
  })
})

describe('clipBytes', () => {
  it('keeps short text and cuts long text at a line, under the byte cap', () => {
    expect(clipBytes('a\nb', 100)).toBe('a\nb')
    const text = Array.from({ length: 200 }, (_, i) => `row ${i} — ünïcode`).join('\n')
    const cut = clipBytes(text, 1000)
    expect(new TextEncoder().encode(cut).length).toBeLessThanOrEqual(1000)
    expect(cut.endsWith('… (cut)')).toBe(true)
    expect(cut.split('\n').slice(0, -1).every((l) => l.startsWith('row '))).toBe(true)
  })

  it('cuts one huge line too', () => {
    expect(new TextEncoder().encode(clipBytes('x'.repeat(5000), 500)).length).toBeLessThanOrEqual(500)
  })
})

describe('eventContextTitle', () => {
  it('names a Sentry error by its last exception, a message by its text', () => {
    const err = ev(EventTypes.Sentry, {
      exception: { values: [{ type: 'Inner', value: 'x' }, { type: 'OrderError', value: 'Order 15 not found' }] }
    })
    expect(eventContextTitle(err)).toBe('Sentry error · OrderError: Order 15 not found')
    expect(eventContextTitle(ev(EventTypes.Sentry, { message: 'Queue is slow' }))).toBe('Sentry message · Queue is slow')
  })

  it('uses the type and its subject; without one, the short uuid', () => {
    expect(eventContextTitle(ev(EventTypes.Monolog, { level_name: 'ERROR', message: 'Payment failed' }))).toBe(
      'Monolog · ERROR Payment failed'
    )
    expect(eventContextTitle(ev(EventTypes.HttpDump, { request: { method: 'POST', uri: '/api/pay' } }))).toBe(
      'Http Dump · POST /api/pay'
    )
    expect(eventContextTitle(ev(EventTypes.VarDump, { value: 1 }, '0b7e91c2-ffff'))).toMatch(/· 0b7e91c2$/)
  })
})

describe('page text', () => {
  it('one key per page and project', () => {
    expect(pageKey('/sentry/exceptions', 'shop')).toBe('/sentry/exceptions?project=shop')
    expect(pageKey('/smtp', null)).toBe('/smtp')
  })

  it('says where, which project, period, filters, count and the first rows', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ev(EventTypes.Monolog, { message: `m${i}` }, `uuid-${i}`))
    const text = pageText({
      title: 'Monolog list',
      path: '/monolog?f=host:web-1',
      project: 'shop',
      period: '24h',
      filters: [{ key: 'host', value: 'web-1', not: false }, { key: 'level', value: 'debug', not: true }],
      count: 30,
      rows
    })
    expect(text).toContain('Page: Monolog list')
    expect(text).toContain('Project: shop')
    expect(text).toContain('Filters: host=web-1, not level=debug')
    expect(text).toContain('Items shown: 30')
    expect(text).toContain('First 20 (type | title | uuid | time):')
    expect(text).toContain('uuid-19')
    expect(text).not.toContain('uuid-20')
  })
})

describe('panel state', () => {
  it('clamps the width to 360–640', () => {
    expect(clampAssistWidth(100)).toBe(ASSIST_WIDTH.min)
    expect(clampAssistWidth(9999)).toBe(ASSIST_WIDTH.max)
    expect(clampAssistWidth(Number.NaN)).toBe(ASSIST_WIDTH.initial)
  })

  it('closing gives focus back to the opener', () => {
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    openAssist(btn)
    expect(isAssistOpen.value).toBe(true)
    document.body.focus()
    closeAssist()
    expect(isAssistOpen.value).toBe(false)
    expect(document.activeElement).toBe(btn)
    toggleAssist(btn)
    expect(isAssistOpen.value).toBe(true)
    toggleAssist()
    expect(isAssistOpen.value).toBe(false)
    btn.remove()
  })
})
