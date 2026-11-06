import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { XdebugAgentCall } from '../../types'
import XdebugAgentTimeline from './xdebug-agent-timeline.vue'

const call = (seq: number, over: Partial<XdebugAgentCall> = {}): XdebugAgentCall => ({
  seq, session_id: '1', at: '2026-11-06T12:00:00Z', tool: 'xdebug_stack', args: '', ok: true,
  result_summary: '19 frames', duration_ms: 3, ...over
})

describe('XdebugAgentTimeline', () => {
  it('says the agent has not looked when there are no calls', () => {
    const w = mount(XdebugAgentTimeline, { props: { calls: [] } })
    expect(w.text()).toContain('The agent has not looked at this session.')
  })

  it('shows a refused call with a mark and the reason, not by colour alone', () => {
    const w = mount(XdebugAgentTimeline, {
      props: { calls: [call(1, { ok: false, tool: 'xdebug_eval', result_summary: 'refused — session is not paused' })] }
    })
    expect(w.find('.xdebug-tl__dot--bad').exists()).toBe(true)
    expect(w.find('.xdebug-tl__refused').text()).toBe('refused: session is not paused')
  })

  it('shows the call in flight as «reading…»', () => {
    const w = mount(XdebugAgentTimeline, {
      props: { calls: [], inflight: { session_id: '1', tool: 'xdebug_property', args: '$user', at: '2026-11-06T12:00:00Z' } }
    })
    expect(w.find('.is-live').text()).toContain('reading…')
    expect(w.text()).not.toContain('has not looked')
  })

  it('announces new calls as a summary', async () => {
    const w = mount(XdebugAgentTimeline, { props: { calls: [call(1)] } })
    await w.setProps({ calls: [call(1), call(2), call(3)] })
    expect(w.find('[aria-live="polite"]').text()).toBe('2 new agent calls')
  })
})
