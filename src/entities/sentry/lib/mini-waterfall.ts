type SpanTiming = { start_offset_ms: number; duration_ms: number }

const num = (n: number) => (Number.isFinite(n) ? n : 0)
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// The length the bars are drawn against: the trace's duration, stretched to
// the latest span end. A trace duration can be shorter than its spans (async
// work that ends after the root request, other backends, client clocks):
// frontend#390. 0 when nothing has a length.
export const waterfallScale = (spans: SpanTiming[], totalMs: number): number =>
  Math.max(
    num(totalMs),
    0,
    ...spans.map((s) => Math.max(0, num(s.start_offset_ms)) + Math.max(0, num(s.duration_ms)))
  )

// A bar's place on the track in percent, always inside [0, 100]; at least 1 %
// wide where there is room. null without a scale.
export const barGeometry = (span: SpanTiming, scale: number): { left: number; width: number } | null => {
  if (!(scale > 0)) return null
  const left = clamp((num(span.start_offset_ms) / scale) * 100, 0, 100)
  const width = clamp((num(span.duration_ms) / scale) * 100, 1, 100)
  return { left, width: Math.min(width, 100 - left) }
}
