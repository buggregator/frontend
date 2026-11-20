import { useDocumentVisibility } from '@vueuse/core'
import { onBeforeUnmount, watch, type Ref } from 'vue'
import type { Pt, ServiceMapModel } from '../../lib/service-map/service-map-model'
import { createTraffic, placeOn } from '../../lib/service-map/traffic'

// Draws the map's particles on one canvas in one animation loop (#6540): one
// DOM node per particle does not scale past a few hundred.

type Options = {
  canvas: Ref<HTMLCanvasElement | undefined>
  model: Ref<ServiceMapModel | null>
  // Lines that stay lit; null: all.
  lit: Ref<Set<string> | null>
  // false: paused or reduced motion, one still frame.
  running: Ref<boolean>
}

type Geometry = { samples: Pt[]; band: number }

export const useTrafficCanvas = ({ canvas, model, lit, running }: Options) => {
  const visibility = useDocumentVisibility()
  let traffic: ReturnType<typeof createTraffic> | null = null
  let geometry = new Map<string, Geometry>()
  let frame = 0
  let last = 0

  const rebuild = () => {
    const m = model.value
    if (!m) {
      traffic = null
      geometry = new Map()
      return
    }
    const streams = [
      ...m.edges.map((e) => ({ id: e.id, rate: e.emission, travel: e.travel, errorRate: e.errorRate })),
      ...m.entries.map((e) => ({ id: e.id, rate: e.emission, travel: e.travel, errorRate: 0 }))
    ]
    geometry = new Map([
      ...m.edges.map((e) => [e.id, { samples: e.samples, band: e.band }] as const),
      ...m.entries.map((e) => [e.id, { samples: e.samples, band: e.band }] as const)
    ])
    traffic = createTraffic(streams)
    traffic.fill()
  }

  const draw = () => {
    const el = canvas.value
    const m = model.value
    if (!el || !m || !traffic) return
    const dpr = window.devicePixelRatio || 1
    const w = Math.ceil(m.width * dpr)
    const h = Math.ceil(m.height * dpr)
    if (el.width !== w || el.height !== h) {
      el.width = w
      el.height = h
    }
    const ctx = el.getContext('2d')
    if (!ctx) return
    const css = getComputedStyle(el)
    const dot = css.getPropertyValue('--tg-dot').trim() || '#fff'
    const err = css.getPropertyValue('--tg-edge-err').trim() || '#f87171'
    const ring = css.getPropertyValue('--tg-canvas').trim() || '#111827'
    const litSet = lit.value

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, m.width, m.height)
    for (const p of traffic.particles()) {
      const g = geometry.get(p.stream)
      if (!g) continue
      const at = placeOn(g.samples, p.t, p.j, g.band)
      ctx.globalAlpha = litSet && !litSet.has(p.stream) ? 0.15 : 1
      ctx.beginPath()
      if (p.err) {
        // A canvas ring separates a red particle from the band (#6540 contrast).
        ctx.arc(at.x, at.y, 2.1, 0, Math.PI * 2)
        ctx.fillStyle = err
        ctx.lineWidth = 1.5
        ctx.strokeStyle = ring
        ctx.stroke()
        ctx.fill()
      } else {
        ctx.arc(at.x, at.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = dot
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  const tick = (now: number) => {
    frame = 0
    if (!traffic) return
    traffic.step(last ? (now - last) / 1000 : 0)
    last = now
    draw()
    frame = requestAnimationFrame(tick)
  }

  const stop = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    last = 0
  }

  const sync = () => {
    stop()
    if (running.value && visibility.value === 'visible') frame = requestAnimationFrame(tick)
    else draw()
  }

  watch(
    model,
    () => {
      rebuild()
      // The canvas mounts with the map: draw on the next frame.
      requestAnimationFrame(sync)
    },
    { immediate: true }
  )
  watch([running, visibility], sync)
  watch(lit, () => {
    if (!frame) draw()
  })
  watch(canvas, sync)

  onBeforeUnmount(stop)

  return { redraw: draw }
}
