import colors from 'tailwindcss/colors'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import type { HttpDump } from '../../types'
import { useHttpDumpEvent } from './use-http-dump-event'

// The app maps red to rose (tailwind.config.js).
const palette: Record<string, Record<string, string>> = {
  ...(colors as unknown as Record<string, Record<string, string>>),
  red: colors.rose,
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// Light-mode text and fill of a badge class list, e.g. «text-green-700 … bg-green-50 …».
const lightContrast = (classes: string) => {
  const [, tc, ts] = classes.match(/(?:^| )text-(\w+)-(\d+)/)!
  const [, bc, bs] = classes.match(/(?:^| )bg-(\w+)-(\d+)/)!
  return ratio(palette[tc][ts], palette[bc][bs])
}

const event = (method: string, status: number) =>
  ref({ payload: { request: { method, uri: '/x', headers: {} }, response: { status_code: status } } } as unknown as NormalizedEvent<HttpDump>)

// Audit 5.11 / mock-server spec §3: -600 text on a -50 fill was 3.1:1 for 11 px badges.
describe('HTTP dump badges, light mode', () => {
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    it(`${method} badge reads at 4.5:1 or more`, () => {
      const c = useHttpDumpEvent(event(method, 200)).methodColor.value
      expect(lightContrast(c)).toBeGreaterThanOrEqual(4.5)
    })
  }
  for (const status of [200, 301, 404, 500]) {
    it(`status ${status} badge reads at 4.5:1 or more`, () => {
      const c = useHttpDumpEvent(event('GET', status)).statusColor.value
      expect(lightContrast(c)).toBeGreaterThanOrEqual(4.5)
    })
  }
  it('uses the -700 shades for colored badges', () => {
    expect(useHttpDumpEvent(event('GET', 500)).methodColor.value).toContain('text-green-700')
    expect(useHttpDumpEvent(event('GET', 500)).statusColor.value).toContain('text-red-700')
  })
})
