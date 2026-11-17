import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// The section the reader is in: the topmost one in the upper 40% of the
// window. A jump from the list wins for a moment over the scroll it causes.
export const useSectionSpy = (ids: () => string[]) => {
  const active = ref(ids()[0] ?? '')
  const visible = new Map<string, boolean>()
  let observer: IntersectionObserver | null = null
  let pinnedUntil = 0

  const pick = () => {
    if (performance.now() < pinnedUntil) return
    const first = ids().find((id) => visible.get(id))
    if (first) active.value = first
  }

  const observe = () => {
    observer?.disconnect()
    visible.clear()
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        pick()
      },
      { rootMargin: '0px 0px -60% 0px' }
    )
    for (const id of ids()) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  const setActive = (id: string) => {
    active.value = id
    pinnedUntil = performance.now() + 600
  }

  onMounted(observe)
  // A section can appear later (About & updates waits for the server).
  watch(ids, () => setTimeout(observe), { flush: 'post' })
  onBeforeUnmount(() => observer?.disconnect())

  return { active, setActive }
}
