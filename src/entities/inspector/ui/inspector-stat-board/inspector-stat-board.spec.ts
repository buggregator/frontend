import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { InspectorTransaction } from '../../types'
import InspectorStatBoard from './inspector-stat-board.vue'

const transaction = (timestamp: number) => ({ timestamp, duration: 56, result: 'success' }) as InspectorTransaction

describe('InspectorStatBoard', () => {
  it('shows the transaction date from Unix seconds, not January 1970', () => {
    const text = mount(InspectorStatBoard, { props: { transaction: transaction(1678366953.702228) } }).text()

    expect(text).toContain(new Date(1678366953702).toString())
    expect(text).not.toContain('1970')
  })

  it('shows a dash when the timestamp is missing', () => {
    const text = mount(InspectorStatBoard, { props: { transaction: transaction(0) } }).text()

    expect(text).toContain('Timestamp —')
  })
})
