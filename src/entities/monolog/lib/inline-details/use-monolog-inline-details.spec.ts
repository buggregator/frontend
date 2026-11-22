import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMonologInlineDetails } from './use-monolog-inline-details'

const preview = (extra: Record<string, unknown>) => ({
  message: 'User logged in', channel: 'app', level: 200, level_name: 'INFO', datetime: '', ...extra,
})
const full = { uuid: 'e1', payload: preview({ context: { user_id: 5 }, extra: { ip: '10.0.0.7' } }) }

describe('useMonologInlineDetails (frontend#283)', () => {
  it('shows nothing and fetches nothing while the setting is off', async () => {
    const fetchFull = vi.fn()
    const d = useMonologInlineDetails('e1', preview({ context: { user_id: 5 } }), ref(false), fetchFull)
    await flushPromises()

    expect(d.isShown.value).toBe(false)
    expect(fetchFull).not.toHaveBeenCalled()
  })

  it('uses the context and extra the preview carries', async () => {
    const fetchFull = vi.fn()
    const d = useMonologInlineDetails('e1', preview({ context: { user_id: 5, source: {} }, extra: [] }), ref(true), fetchFull)
    await flushPromises()

    expect(fetchFull).not.toHaveBeenCalled()
    expect(d.context.value).toEqual({ user_id: 5 })
    expect(d.extra.value).toBeNull()
    expect(d.isShown.value).toBe(true)
  })

  it.each([
    ['the server cut a big context', { context_truncated: true, extra: {} }],
    ['an older server sends no context at all', {}],
  ])('fetches the full event when %s', async (_, previewExtra) => {
    const fetchFull = vi.fn().mockResolvedValue(full)
    const d = useMonologInlineDetails('e1', preview(previewExtra), ref(true), fetchFull)
    await flushPromises()

    expect(fetchFull).toHaveBeenCalledWith('e1')
    expect(d.context.value).toEqual({ user_id: 5 })
    expect(d.extra.value).toEqual({ ip: '10.0.0.7' })
  })

  it('fetches once the setting is turned on, and only once', async () => {
    const fetchFull = vi.fn().mockResolvedValue(full)
    const enabled = ref(false)
    useMonologInlineDetails('e1', preview({}), enabled, fetchFull)

    enabled.value = true
    await flushPromises()
    enabled.value = false
    enabled.value = true
    await flushPromises()

    expect(fetchFull).toHaveBeenCalledTimes(1)
  })

  it('marks a context over 2 KB as big, so the card folds it', async () => {
    const big = { items: Array.from({ length: 150 }, (_, i) => ({ sku: `SKU-${i}`, qty: i })) }
    const d = useMonologInlineDetails('e1', preview({ context: big, extra: { ip: '1' } }), ref(true), vi.fn())
    await flushPromises()

    expect(d.isContextBig.value).toBe(true)
    expect(d.isExtraBig.value).toBe(false)
  })

  it('a failed fetch leaves the card as it is', async () => {
    const fetchFull = vi.fn().mockRejectedValue(new Error('offline'))
    const d = useMonologInlineDetails('e1', preview({ context_truncated: true }), ref(true), fetchFull)
    await flushPromises()

    expect(d.context.value).toBeNull()
    expect(d.isShown.value).toBe(false)
  })
})
