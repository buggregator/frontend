import type { Pt } from './service-map-model'

// Particles along the map lines (#6540, Vizceral-like): each line emits at its
// rate, a particle crosses it in `travel` seconds, the failed share is red.
// Deterministic: same streams and steps give the same particles.

export type Stream = {
  id: string
  // Particles per second.
  rate: number
  // Seconds from one end to the other.
  travel: number
  errorRate: number
}

export type Particle = {
  stream: string
  // 0 at the caller, 1 at the callee.
  t: number
  err: boolean
  // Sideways place in the band, −0.5…0.5.
  j: number
}

// Sums of float steps (100 × 0.01) fall just short of 1.
const EPS = 1e-9

type State = { s: Stream; acc: number; errAcc: number; seed: number; list: Particle[] }

// A small LCG: the same jitter every run, no Math.random in tests.
const next = (st: State) => {
  st.seed = (st.seed * 1664525 + 1013904223) >>> 0
  return st.seed / 0x100000000
}

const hash = (text: string) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0
  return h || 1
}

const emit = (st: State, t: number) => {
  st.errAcc += st.s.errorRate
  const err = st.errAcc >= 1 - EPS
  if (err) st.errAcc -= 1
  st.list.push({ stream: st.s.id, t, err, j: next(st) - 0.5 })
}

export const createTraffic = (streams: Stream[]) => {
  const states: State[] = streams.map((s) => ({ s, acc: 0, errAcc: 0, seed: hash(s.id), list: [] }))

  // A line already in motion: one travel's worth of particles spread along it.
  const fill = () => {
    for (const st of states) {
      st.list = []
      st.acc = 0
      st.errAcc = 0
      const n = Math.floor(st.s.rate * st.s.travel)
      for (let i = n; i > 0; i--) emit(st, i / (n + 1))
    }
  }

  const step = (dt: number) => {
    if (dt <= 0) return
    // A long gap (a hidden tab): start over rather than burst.
    if (dt > 1) {
      fill()
      return
    }
    for (const st of states) {
      const dtT = dt / st.s.travel
      for (const p of st.list) p.t += dtT
      st.list = st.list.filter((p) => p.t <= 1)
      st.acc += st.s.rate * dt
      while (st.acc >= 1 - EPS) {
        st.acc = Math.max(0, st.acc - 1)
        // Emitted at its due moment within the frame: even spacing.
        emit(st, (st.acc / Math.max(st.s.rate, 1e-9)) / st.s.travel)
      }
    }
  }

  const particles = (): Particle[] => states.flatMap((st) => st.list)

  return { fill, step, particles }
}

// Where a particle is: along the lookup table, then sideways in the band.
export const placeOn = (samples: Pt[], t: number, j: number, band: number): Pt => {
  const n = samples.length
  if (n === 0) return { x: 0, y: 0 }
  if (n === 1) return samples[0]
  const f = Math.min(1, Math.max(0, t)) * (n - 1)
  const i = Math.min(n - 2, Math.floor(f))
  const k = f - i
  const a = samples[i]
  const b = samples[i + 1]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const off = j * (band - 3)
  return { x: a.x + dx * k - (dy / len) * off, y: a.y + dy * k + (dx / len) * off }
}
