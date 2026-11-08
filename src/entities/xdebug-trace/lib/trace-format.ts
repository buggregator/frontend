import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import type { XdebugTrace } from '../types'

// Trace times are seconds with microsecond precision.
export const formatSeconds = (seconds: number): string => {
  if (seconds <= 0) return '0 ms'
  if (seconds < 0.001) return `${Number((seconds * 1e6).toFixed(1))} µs`
  if (seconds < 1) return `${Number((seconds * 1e3).toFixed(1))} ms`
  if (seconds < 10) return `${seconds.toFixed(2)} s`
  return `${seconds.toFixed(1)} s`
}

export const formatMemoryDelta = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const size = formatFileSize(Math.abs(bytes))
  return bytes > 0 ? `+${size}` : `−${size}`
}

// What the trace was recorded for: the request, the name the client gave, or the script.
export const traceTitle = (trace: Pick<XdebugTrace, 'name' | 'url' | 'main'>): string =>
  trace.url || trace.name || trace.main || 'Xdebug trace'

// The second line: what the title left out (the name the client gave, the script).
export const traceSubtitle = (trace: Pick<XdebugTrace, 'name' | 'url' | 'main'>): string => {
  const title = traceTitle(trace)
  return [trace.name, trace.main].filter((part) => part && part !== title).join(' · ')
}
