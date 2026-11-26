import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SentrySpanPreview } from '../../types'
import { MiniWaterfall } from '.'

const span = (start_offset_ms: number, duration_ms: number): SentrySpanPreview => ({
  span_id: `s${start_offset_ms}`, op: 'db.sql.query', description: 'SELECT 1', start_offset_ms, duration_ms,
  peer_type: 'db', is_error: false,
})

describe('MiniWaterfall', () => {
  // frontend#390: trace of 200 ms with a worker span at 520 ms
  it('keeps a span that ends after the trace inside the track', () => {
    const w = mount(MiniWaterfall, { props: { spans: [span(0, 200), span(520, 8)], totalMs: 200 } })
    const bars = w.findAll<HTMLElement>('.mini-wf__bar').map((b) => b.element.style)

    expect(parseFloat(bars[1].left)).toBeLessThanOrEqual(100)
    expect(parseFloat(bars[1].left) + parseFloat(bars[1].width)).toBeLessThanOrEqual(100)
    expect(parseFloat(bars[1].width)).toBeGreaterThan(0)
  })

  it('draws no position without any length', () => {
    const w = mount(MiniWaterfall, { props: { spans: [span(0, 0)], totalMs: 0 } })
    expect(w.find<HTMLElement>('.mini-wf__bar').element.style.left).toBe('')
  })
})
