// Pixel-bug project avatars: a 7×7 mirrored 8-bit bug drawn from the project key.
// Same key → same bug and hue everywhere. Our own code: no library, no network.

type ThemeColors = { tile: string; ink: string; eye: string }

export type AvatarHue = {
  name: string
  light: ThemeColors
  dark: ThemeColors
}

export type PixelBug = {
  hue: AvatarHue
  // Filled cells [x, y] of the 7×7 grid, both halves.
  cells: Array<[number, number]>
  // The row of the two eyes (columns 2 and 4).
  eyeRow: number
}

const DARK_BG = '#111827' // gray-900

// Pre-mixed so the tile needs no transparency: `a` over `b` at `t`.
const mix = (a: string, b: string, t: number): string => {
  const rgb = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16))
  const A = rgb(a)
  const B = rgb(b)
  return `#${A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, '0')).join('')}`
}

// Tailwind steps: [100, 400, 500, 600] per hue. Light: 600 on a 100 tile; dark: 400 on 500 at 22% over gray-900.
const PALETTE: Array<[string, string, string, string, string]> = [
  ['blue', '#dbeafe', '#60a5fa', '#3b82f6', '#2563eb'],
  ['teal', '#ccfbf1', '#2dd4bf', '#14b8a6', '#0d9488'],
  ['green', '#dcfce7', '#4ade80', '#22c55e', '#16a34a'],
  ['amber', '#fef3c7', '#fbbf24', '#f59e0b', '#d97706'],
  ['orange', '#ffedd5', '#fb923c', '#f97316', '#ea580c'],
  ['rose', '#ffe4e6', '#fb7185', '#f43f5e', '#e11d48'],
  ['violet', '#ede9fe', '#a78bfa', '#8b5cf6', '#7c3aed'],
  ['indigo', '#e0e7ff', '#818cf8', '#6366f1', '#4f46e5'],
  ['cyan', '#cffafe', '#22d3ee', '#06b6d4', '#0891b2'],
  ['slate', '#e2e8f0', '#94a3b8', '#64748b', '#475569'],
]

export const AVATAR_HUES: AvatarHue[] = PALETTE.map(([name, c100, c400, c500, c600]) => ({
  name,
  light: { tile: c100, ink: c600, eye: '#ffffff' },
  dark: { tile: mix(c500, DARK_BG, 0.22), ink: c400, eye: DARK_BG },
}))

// FNV-1a 32-bit over code points.
export const hashKey = (s: string): number => {
  let h = 0x811c9dc5
  for (const c of s) {
    h ^= c.codePointAt(0) as number
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

// xorshift32 → [0, 1)
const rng = (seed: number) => {
  let x = seed || 1
  return () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }
}

// Chance per cell of the left half (cols 0..3, col 3 = middle); rows: antennae, head, body, legs.
const BUG = [
  [0, 0.7, 0.35, 0],
  [0, 0, 0.6, 1],
  [0.65, 0.25, 1, 1],
  [0, 1, 1, 1],
  [0.65, 0.9, 1, 0.85],
  [0, 0.6, 1, 1],
  [0.65, 0.25, 0.35, 0],
]

export const pixelBug = (key: string): PixelBug => {
  const hue = AVATAR_HUES[hashKey(key) % AVATAR_HUES.length]
  const r = rng(hashKey(`${key}#bug`))
  const grid = BUG.map((row) => row.map((p) => r() < p))
  // A spine, so it is always one creature.
  grid[1][3] = true
  grid[2][3] = true
  grid[3][3] = true

  const cells: Array<[number, number]> = []
  grid.forEach((row, y) =>
    row.forEach((on, x) => {
      if (!on) return
      cells.push([x, y])
      if (x !== 3) cells.push([6 - x, y])
    })
  )

  return { hue, cells, eyeRow: grid[2][2] ? 2 : 3 }
}
