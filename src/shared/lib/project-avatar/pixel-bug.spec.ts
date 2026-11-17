import { describe, expect, it } from 'vitest'
import { AVATAR_HUES, hashKey, pixelBug } from './pixel-bug'

const KEYS = ['default', 'shop', 'billing', 'mobile-app', 'staging', 'api-gateway', 'payments-eu', 'x', '', 'проект']

describe('hashKey', () => {
  it('is FNV-1a 32-bit', () => {
    expect(hashKey('')).toBe(0x811c9dc5)
    expect(hashKey('a')).toBe(0xe40c292c)
  })
})

describe('pixelBug', () => {
  it('gives the same bug for the same key', () => {
    for (const key of KEYS) {
      expect(pixelBug(key)).toEqual(pixelBug(key))
    }
  })

  it('gives different bugs to the stand projects', () => {
    const shapes = ['default', 'shop', 'billing'].map((k) => JSON.stringify(pixelBug(k).cells))
    expect(new Set(shapes).size).toBe(3)
  })

  it('is mirrored around the middle column', () => {
    for (const key of KEYS) {
      const set = new Set(pixelBug(key).cells.map(([x, y]) => `${x},${y}`))
      for (const cell of set) {
        const [x, y] = cell.split(',').map(Number)
        expect(set.has(`${6 - x},${y}`)).toBe(true)
      }
    }
  })

  it('always has a spine and two eyes on the head', () => {
    for (const key of KEYS) {
      const bug = pixelBug(key)
      const set = new Set(bug.cells.map(([x, y]) => `${x},${y}`))
      expect(set.has('3,1') && set.has('3,2') && set.has('3,3')).toBe(true)
      expect([2, 3]).toContain(bug.eyeRow)
      expect(bug.cells.every(([x, y]) => x >= 0 && x < 7 && y >= 0 && y < 7)).toBe(true)
    }
  })

  it('takes one hue of the palette from the key', () => {
    expect(AVATAR_HUES).toHaveLength(10)
    for (const key of KEYS) {
      const { hue } = pixelBug(key)
      expect(AVATAR_HUES).toContain(hue)
      expect(hue).toBe(AVATAR_HUES[hashKey(key) % AVATAR_HUES.length])
    }
  })

  it('uses 600 on a 100 tile in light and 400 on a dark tile', () => {
    const blue = AVATAR_HUES.find((h) => h.name === 'blue')!
    expect(blue.light).toEqual({ tile: '#dbeafe', ink: '#2563eb', eye: '#ffffff' })
    expect(blue.dark.ink).toBe('#60a5fa')
    expect(blue.dark.tile).toMatch(/^#[0-9a-f]{6}$/)
  })
})
