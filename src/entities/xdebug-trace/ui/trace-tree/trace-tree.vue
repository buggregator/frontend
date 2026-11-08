<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue'
import { ROOT, type TraceTreeState } from '../../lib/use-trace-tree'
import TraceTreeLevel from './trace-tree-level.vue'

type Props = {
  tree: TraceTreeState
}

const props = defineProps<Props>()

const root = ref<HTMLElement | null>(null)

// A search hit was revealed: bring its row into view and give it focus.
watch(() => props.tree.highlighted.value, async (offset) => {
  if (offset === null) return
  await nextTick()
  const row = root.value?.querySelector<HTMLElement>(`[data-offset="${offset}"]`)
  if (!row) return
  row.scrollIntoView({ block: 'center' })
  row.focus({ preventScroll: true })
})
</script>

<template>
  <div
    ref="root"
    class="trace-tree"
  >
    <div
      class="trace-tree__head"
      aria-hidden="true"
    >
      <span class="trace-tree__head-call">Function</span>
      <span class="trace-tree__head-metrics">
        <span class="trace-tree__head-file">File</span>
        <span class="trace-tree__head-num">Incl.</span>
        <span class="trace-tree__head-num">Self</span>
        <span class="trace-tree__head-num">Memory</span>
      </span>
    </div>
    <p
      v-if="tree.isLoaded(ROOT) && !tree.childrenOf(ROOT).length && !tree.errorOf(ROOT)"
      class="trace-tree__empty"
    >
      The trace has no calls.
    </p>
    <TraceTreeLevel
      :tree="tree"
      :parent="ROOT"
    />
  </div>
</template>

<style lang="scss" scoped>
.trace-tree {
  @apply min-w-0;

  // Rows get focus when a search hit is revealed.
  :deep([data-offset]) {
    @apply outline-none;
  }

  :deep([data-offset]:focus-visible) {
    @apply outline outline-2 outline-blue-500;
  }
}

.trace-tree__head {
  @apply hidden md:flex items-center gap-3 pb-1 mb-1 pr-2 border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.trace-tree__head-call {
  @apply flex-1 pl-7;
}

.trace-tree__head-metrics {
  @apply flex items-center gap-3;
}

.trace-tree__head-file {
  @apply w-auto;
}

.trace-tree__head-num {
  @apply w-20 text-right;
}

.trace-tree__empty {
  @apply py-4 text-sm text-gray-500 dark:text-gray-400;
}
</style>
