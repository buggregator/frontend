import type { Ref } from 'vue'
import { computed, ref, shallowRef, watch } from 'vue'

type Highlighter = typeof import('./highlighter')

// highlight.js is not in the first load (#6841): the first snippet loads it.
// Until then (and for a language it never learns) the code shows as plain,
// escaped text in the same box.
const engine = shallowRef<Highlighter | null>(null)
let loading: Promise<Highlighter> | null = null
const loadEngine = () =>
  (loading ??= import('./highlighter').then((mod) => {
    engine.value = mod
    return mod
  }))

// Bumped when more languages are registered, so every snippet re-checks.
const registered = ref(0)

export const escapeHtml = (code: string): string =>
  code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

// The highlighted HTML of `code` in `language`, and the class for its
// <code> element (`hljs <language>`, as @highlightjs/vue-plugin rendered it).
export const useHighlight = (code: Ref<string>, language: Ref<string>) => {
  watch(
    language,
    (name) => {
      loadEngine()
        .then((mod) => {
          if (name && !mod.knows(name)) {
            return mod.loadCommonLanguages().then(() => {
              registered.value += 1
            })
          }
          return undefined
        })
        .catch(() => {
          // Offline or a failed chunk: the snippet stays plain text.
        })
    },
    { immediate: true }
  )

  // The language to highlight with: the asked one once highlight.js knows
  // it, plain text before that or if it never does.
  const active = computed(() => {
    void registered.value
    const mod = engine.value
    return mod && mod.knows(language.value) ? language.value : 'plaintext'
  })

  const html = computed(() => {
    const mod = engine.value
    return mod ? mod.highlight(code.value, active.value) : escapeHtml(code.value)
  })

  const className = computed(() => `hljs ${active.value}`)

  return { active, html, className }
}
