<script lang="ts" setup>
import { reactive } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { formatMemoryDelta, formatSeconds } from '../../lib/trace-format'
import { shortPath } from '../../lib/trace-path'
import { ROOT, type TraceTreeState } from '../../lib/use-trace-tree'
import type { XdebugTraceNode } from '../../types'

type Props = {
  tree: TraceTreeState
  parent: number // offset of the caller, ROOT for the top level
}

const props = defineProps<Props>()

const { buildLink } = useIdeLink()

// Calls whose arguments and return value are shown.
const detailsOpen = reactive(new Set<number>())
const toggleDetails = (offset: number) => {
  if (detailsOpen.has(offset)) detailsOpen.delete(offset)
  else detailsOpen.add(offset)
}

const hasDetails = (node: XdebugTraceNode) => (node.args?.length ?? 0) > 0 || node.return !== undefined

const label = (node: XdebugTraceNode) => (props.tree.isExpanded(node.offset) ? 'Collapse' : 'Expand') + ` ${node.func}`
</script>

<template>
  <ul
    class="trace-level"
    :class="{ 'trace-level--nested': parent !== ROOT }"
  >
    <li
      v-for="node in tree.childrenOf(parent)"
      :key="node.offset"
      class="trace-level__item"
    >
      <div
        class="trace-row"
        :class="{ 'trace-row--hit': tree.highlighted.value === node.offset }"
        :data-offset="node.offset"
        tabindex="-1"
      >
        <div class="trace-row__call">
          <button
            v-if="node.children > 0"
            type="button"
            class="trace-row__toggle"
            :aria-expanded="tree.isExpanded(node.offset)"
            :aria-label="label(node)"
            :title="`${node.children} direct call${node.children === 1 ? '' : 's'}`"
            @click="tree.toggle(node)"
          >
            <span
              class="trace-row__chevron"
              :class="{ 'trace-row__chevron--open': tree.isExpanded(node.offset) }"
              aria-hidden="true"
            >▸</span>
          </button>
          <span
            v-else
            class="trace-row__toggle trace-row__toggle--leaf"
            aria-hidden="true"
          />

          <span
            class="trace-row__func"
            :class="{ 'trace-row__func--internal': !node.user }"
          >{{ node.func }}</span>
          <span
            v-if="node.include"
            class="trace-row__include"
            :title="node.include"
          >{{ shortPath(node.include) }}</span>
          <span
            v-if="node.children > 0"
            class="trace-row__count"
          >{{ node.children }}</span>
          <span
            v-if="!node.done"
            class="trace-row__open"
            title="The trace ends before this call returned"
          >no exit</span>
          <button
            v-if="hasDetails(node)"
            type="button"
            class="trace-row__details-btn"
            :aria-expanded="detailsOpen.has(node.offset)"
            @click="toggleDetails(node.offset)"
          >
            args{{ node.args?.length ? ` (${node.args.length})` : '' }}
          </button>
        </div>

        <div class="trace-row__metrics">
          <a
            v-if="buildLink(node.file, node.line)"
            class="trace-row__file"
            :href="buildLink(node.file, node.line) as string"
            :title="`${node.file}:${node.line}`"
          >{{ shortPath(node.file) }}:{{ node.line }}</a>
          <span
            v-else
            class="trace-row__file"
            :title="`${node.file}:${node.line}`"
          >{{ shortPath(node.file) }}:{{ node.line }}</span>
          <span
            class="trace-row__num"
            title="Inclusive time"
          ><span class="trace-row__label">incl </span>{{ formatSeconds(node.incl) }}</span>
          <span
            class="trace-row__num trace-row__num--self"
            title="Self time"
          ><span class="trace-row__label">self </span>{{ formatSeconds(node.self) }}</span>
          <span
            class="trace-row__num"
            :class="{ 'trace-row__num--grow': node.memory > 0 }"
            title="Memory change"
          ><span class="trace-row__label">mem </span>{{ formatMemoryDelta(node.memory) }}</span>
        </div>
      </div>

      <dl
        v-if="detailsOpen.has(node.offset)"
        class="trace-row__details"
      >
        <template
          v-for="(arg, i) in node.args ?? []"
          :key="i"
        >
          <dt>${{ i + 1 }}</dt>
          <dd>{{ arg }}</dd>
        </template>
        <template v-if="node.return !== undefined">
          <dt>return</dt>
          <dd>{{ node.return }}</dd>
        </template>
      </dl>

      <TraceTreeLevel
        v-if="tree.isExpanded(node.offset)"
        :tree="tree"
        :parent="node.offset"
      />
    </li>

    <li
      v-if="tree.isLoading(parent)"
      class="trace-level__state"
      role="status"
    >
      Loading calls…
    </li>
    <li
      v-else-if="tree.errorOf(parent)"
      class="trace-level__state trace-level__state--error"
      role="alert"
    >
      Could not load calls: {{ tree.errorOf(parent) }}
      <button
        type="button"
        class="trace-level__btn"
        @click="tree.retry(parent)"
      >
        Retry
      </button>
    </li>
    <li
      v-else-if="tree.hasMore(parent)"
      class="trace-level__state"
    >
      <button
        type="button"
        class="trace-level__btn"
        @click="tree.loadMore(parent)"
      >
        Show more calls
      </button>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.trace-level {
  @apply text-xs;
}

.trace-level--nested {
  @apply ml-2.5 pl-2 border-l border-gray-200 dark:border-gray-700;
}

.trace-row {
  @apply flex flex-wrap items-center gap-x-3 gap-y-0.5 py-0.5 pr-2 rounded;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  scroll-margin: 6rem;
}

.trace-row--hit {
  @apply bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20;
}

.trace-row__call {
  @apply flex items-center gap-1.5 min-w-0 flex-1 basis-64;
}

.trace-row__toggle {
  @apply w-5 h-5 flex items-center justify-center flex-shrink-0 rounded;
  @apply text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.trace-row__toggle--leaf {
  @apply hover:bg-transparent dark:hover:bg-transparent;
}

.trace-row__chevron {
  @apply inline-block transition-transform;
}

.trace-row__chevron--open {
  @apply rotate-90;
}

.trace-row__func {
  @apply font-mono font-medium text-gray-900 dark:text-gray-100 break-all;
}

.trace-row__func--internal {
  @apply font-normal text-gray-500 dark:text-gray-400;
}

.trace-row__include {
  @apply font-mono text-gray-500 dark:text-gray-400 truncate;
}

.trace-row__count {
  @apply text-2xs font-mono px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.trace-row__open {
  @apply text-2xs font-mono px-1 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400;
}

.trace-row__details-btn {
  @apply text-2xs font-mono px-1 rounded text-blue-700 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.trace-row__metrics {
  // Phone: a second line under the call, wrapping as needed. Desktop: columns on the right.
  @apply flex flex-wrap items-center gap-x-3 min-w-0 max-w-full pl-6 md:flex-nowrap md:ml-auto;
  @apply font-mono text-gray-600 dark:text-gray-300;
}

.trace-row__file {
  @apply truncate min-w-0 max-w-full md:max-w-[16rem] text-gray-500 dark:text-gray-400;
}

a.trace-row__file {
  @apply hover:underline text-blue-700 dark:text-blue-400;
}

.trace-row__num {
  @apply md:w-20 md:text-right tabular-nums whitespace-nowrap;
}

// Phone has no column header: each number says what it is.
.trace-row__label {
  @apply md:hidden font-sans text-2xs text-gray-400 dark:text-gray-500;
}

.trace-row__num--self {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.trace-row__num--grow {
  @apply text-red-700 dark:text-red-400;
}

.trace-row__details {
  @apply grid gap-x-2 gap-y-0.5 ml-7 my-1 p-2 rounded font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300;
  grid-template-columns: max-content minmax(0, 1fr);

  dt {
    @apply text-gray-500 dark:text-gray-400;
  }

  dd {
    @apply break-all whitespace-pre-wrap;
  }
}

.trace-level__state {
  @apply py-1 pl-7 text-gray-500 dark:text-gray-400;
}

.trace-level__state--error {
  @apply text-red-700 dark:text-red-400;
}

.trace-level__btn {
  @apply ml-1 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}
</style>
