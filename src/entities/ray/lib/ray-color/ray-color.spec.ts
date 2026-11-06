import { describe, expect, it } from 'vitest'
import { rayColorClass } from './ray-color'

describe('rayColorClass', () => {
  it('maps every Ray color to a literal class', () => {
    expect(['green', 'orange', 'red', 'purple', 'blue'].map((c) => rayColorClass(c))).toEqual([
      ['text-green-500'],
      ['text-orange-500'],
      ['text-red-500'],
      ['text-purple-500'],
      ['text-blue-500'],
    ])
  })

  it('keeps the default color for gray, unknown or no color', () => {
    expect(rayColorClass('gray')).toEqual([])
    expect(rayColorClass('pink')).toEqual([])
    expect(rayColorClass(undefined)).toEqual([])
  })
})
