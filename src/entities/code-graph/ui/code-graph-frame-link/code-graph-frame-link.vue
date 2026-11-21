<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { CodeLocationLinkProps } from '@/shared/lib/code-location-link'
import { codeLink, frameSymbolReason, useFrameSymbol } from '../../lib'

// «Graph» on a stack frame, «Code» on a span (#6573 A): shown only when the
// file and line resolve to a symbol; a vendor file or a line outside any
// function says why in muted text instead.
const props = withDefaults(defineProps<CodeLocationLinkProps>(), {
  origin: undefined,
  label: 'Graph'
})

const route = useRoute()
const state = useFrameSymbol(
  () => props.file,
  () => props.line
)

const symbol = computed(() => (state.value.state === 'found' ? state.value.symbol : null))
const reason = computed(() => frameSymbolReason(state.value))

const displayName = computed(() => {
  const s = symbol.value
  if (!s) return ''
  return s.kind === 'method' || s.kind === 'function' ? `${s.name}()` : s.name
})

const to = computed(() => {
  const s = symbol.value
  if (!s) return null
  const base = props.file.split(/[\\/]/).pop() || props.file
  const where = `${props.label === 'Graph' ? 'frame ' : ''}${base}:${props.line}`
  return codeLink({
    symbol: s.id,
    fqn: s.fqn,
    root: s.root,
    file: props.file,
    line: props.line,
    from: props.origin ? `${props.origin}, ${where}` : where,
    back: route.fullPath
  })
})
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    class="cg-frame-link"
    :aria-label="`Open ${displayName} in the code graph`"
    :title="`Open ${displayName} in the code graph`"
    data-test="code-graph-link"
  >
    <svg
      class="cg-frame-link__icon"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="4"
        cy="8"
        r="2"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle
        cx="12"
        cy="4"
        r="2"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <path
        d="M5.8 7.1 10.2 4.9M5.8 8.9l4.4 2.2"
        stroke="currentColor"
        stroke-width="1.4"
      />
    </svg>
    <span>{{ label }}</span>
  </RouterLink>
  <span
    v-else-if="reason"
    class="cg-frame-link__reason"
    data-test="code-graph-reason"
  >{{ reason }}</span>
</template>

<style lang="scss" scoped>
.cg-frame-link {
  @apply inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs;
  @apply border border-gray-300 text-gray-700 hover:bg-gray-100;
  @apply dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700;
  min-height: 24px;

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: 2px;
  }
}

.cg-frame-link__icon {
  @apply w-3.5 h-3.5;
}

.cg-frame-link__reason {
  @apply whitespace-nowrap text-xs text-gray-600 dark:text-gray-400;
}
</style>
