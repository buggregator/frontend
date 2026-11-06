import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

// Languages the app asks for itself (event payloads, HTTP bodies, SQL, curl)
// ship with the first load. `xml` also answers to `html`.
const BUNDLED = { bash, css, javascript, json, php, plaintext, sql, xml }
for (const [name, language] of Object.entries(BUNDLED)) {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, language)
}

// A dump may name any language (VarDumper's `language` context). The rest of
// highlight.js's common set loads on the first such request.
let commonLanguages: Promise<unknown> | null = null
const loadCommonLanguages = () => (commonLanguages ??= import('highlight.js/lib/common'))

// Bumped when more languages are registered, so every snippet re-checks.
const registered = ref(0)

const known = (language: string) => Boolean(language) && Boolean(hljs.getLanguage(language))

// The language to pass to the highlighter: the asked one once highlight.js
// knows it, plain text before that or if it never does.
export const useHighlightLanguage = (language: Ref<string>) => {
  watch(
    language,
    (name) => {
      if (name && !known(name)) {
        loadCommonLanguages()
          .then(() => {
            registered.value += 1
          })
          .catch(() => {
            // Offline or a failed chunk: the snippet stays plain text.
          })
      }
    },
    { immediate: true }
  )

  return computed(() => {
    void registered.value
    return known(language.value) ? language.value : 'plaintext'
  })
}
