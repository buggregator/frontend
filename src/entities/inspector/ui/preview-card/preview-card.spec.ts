import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ServerEvent } from '@/shared/types'
import { normalizeInspectorEvent } from '../../lib/use-inspector/normalize-inspector-event'
import inspectorMock from '../../mocks/inspector.json'
import type { Inspector } from '../../types'
import PreviewCard from './preview-card.vue'

// The list card of an Inspector event: the SDK sends the transaction time as Unix seconds.
const mountCard = (timestamp: number) => {
  const event = structuredClone(inspectorMock) as unknown as ServerEvent<Inspector>
  event.payload[0].timestamp = timestamp

  return mount(PreviewCard, {
    props: { event: normalizeInspectorEvent(event) },
    global: {
      stubs: {
        PreviewCard: { template: '<div><slot /></div>' },
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('Inspector list card', () => {
  it('shows the transaction date from Unix seconds, not January 1970', () => {
    const text = mountCard(1678366953.702228).text()

    expect(text).toContain(new Date(1678366953702).toString())
    expect(text).not.toContain('1970')
  })

  it('shows the same date when the timestamp comes in milliseconds', () => {
    const text = mountCard(1678366953702).text()

    expect(text).toContain(new Date(1678366953702).toString())
    expect(text).not.toContain('1970')
  })
})
