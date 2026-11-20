// Pure maths of a pan/zoom view: a transform `translate(x, y) scale(k)` over
// content of a known size inside a box (#6533 seq-zoom).

export type PanZoom = { x: number; y: number; k: number }
export type Size = { width: number; height: number }
export type ZoomLimits = { min: number; max: number }

export const clampScale = (k: number, { min, max }: ZoomLimits) => Math.min(max, Math.max(min, k))

// Whole content in view when it stays readable; a tall content is fitted by
// width and starts at the top (the rest is a pan away).
export const fitContent = (box: Size, content: Size, limits: ZoomLimits, padding = 16): PanZoom => {
  if (!box.width || !box.height || !content.width || !content.height) return { x: 0, y: 0, k: 1 }
  const byWidth = Math.min(1, (box.width - padding * 2) / content.width)
  const byHeight = (box.height - padding * 2) / content.height
  const k = clampScale(byHeight >= byWidth ? byWidth : Math.max(byHeight, byWidth / 2), limits)
  const x = (box.width - content.width * k) / 2
  const fitsHeight = content.height * k <= box.height - padding * 2
  const y = fitsHeight ? (box.height - content.height * k) / 2 : padding
  return { x, y, k }
}

// Zoom by `factor` keeping the content point under (px, py) in place.
export const zoomAt = (t: PanZoom, factor: number, px: number, py: number, limits: ZoomLimits): PanZoom => {
  const k = clampScale(t.k * factor, limits)
  const r = k / t.k
  return { k, x: px - (px - t.x) * r, y: py - (py - t.y) * r }
}
