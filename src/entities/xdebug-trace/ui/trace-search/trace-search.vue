<script lang="ts" setup>
import { formatSeconds } from '../../lib/trace-format'
import { shortPath } from '../../lib/trace-path'
import type { TraceSearchState } from '../../lib/use-trace-search'
import type { XdebugTraceNode } from '../../types'

type Props = {
  search: TraceSearchState
}

const props = defineProps<Props>()

// The search state is owned by the page; the box writes its query ref.
const query = props.search.query

const emit = defineEmits<{
  reveal: [hit: XdebugTraceNode]
}>()
</script>

<template>
  <section class="trace-search">
    <form
      class="trace-search__form"
      role="search"
      @submit.prevent="search.run()"
    >
      <input
        v-model="query"
        type="search"
        class="trace-search__input"
        placeholder="Find a function or file, e.g. PDO->query"
        aria-label="Find calls by function or file"
        @keydown.escape="search.clear()"
      >
      <button
        type="submit"
        class="trace-search__btn"
        :disabled="search.loading.value"
      >
        Find
      </button>
    </form>

    <p
      v-if="search.error.value"
      class="trace-search__state trace-search__state--error"
      role="alert"
    >
      Search failed: {{ search.error.value }}
    </p>

    <div
      v-if="search.searched.value || search.loading.value"
      class="trace-search__results"
    >
      <p
        class="trace-search__state"
        role="status"
      >
        <template v-if="search.loading.value && !search.hits.value.length">
          Searching…
        </template>
        <template v-else-if="!search.hits.value.length">
          No calls match «{{ search.searched.value }}».
        </template>
        <template v-else>
          {{ search.hits.value.length }}{{ search.next.value !== null ? '+' : '' }}
          call{{ search.hits.value.length === 1 ? '' : 's' }} match «{{ search.searched.value }}». Pick one to see it in the tree.
          <button
            type="button"
            class="trace-search__link"
            @click="search.clear()"
          >
            Clear
          </button>
        </template>
      </p>

      <ul
        v-if="search.hits.value.length"
        class="trace-search__list"
      >
        <li
          v-for="hit in search.hits.value"
          :key="hit.offset"
        >
          <button
            type="button"
            class="trace-search__hit"
            @click="emit('reveal', hit)"
          >
            <span class="trace-search__func">{{ hit.func }}</span>
            <span class="trace-search__where">{{ shortPath(hit.file) }}:{{ hit.line }} · depth {{ hit.level }}</span>
            <span class="trace-search__time">{{ formatSeconds(hit.incl) }}</span>
          </button>
        </li>
      </ul>

      <button
        v-if="search.next.value !== null"
        type="button"
        class="trace-search__btn trace-search__more"
        :disabled="search.loading.value"
        @click="search.more()"
      >
        {{ search.loading.value ? 'Loading…' : 'More results' }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.trace-search {
  @apply flex flex-col gap-2;
}

.trace-search__form {
  @apply flex gap-2;
}

.trace-search__input {
  @apply flex-1 min-w-0 px-2.5 py-1.5 rounded text-sm font-mono;
  @apply bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600;
  @apply text-gray-900 dark:text-gray-100 placeholder:text-gray-400;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.trace-search__btn {
  @apply px-3 py-1.5 rounded text-sm font-medium;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100;
  @apply hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.trace-search__results {
  @apply flex flex-col gap-1 p-2 rounded border border-gray-200 dark:border-gray-700;
}

.trace-search__state {
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.trace-search__state--error {
  @apply text-red-700 dark:text-red-400;
}

.trace-search__link {
  @apply ml-1 text-blue-700 dark:text-blue-400 hover:underline;
}

.trace-search__list {
  @apply max-h-64 overflow-y-auto;
}

.trace-search__hit {
  @apply w-full flex flex-wrap items-baseline gap-x-3 px-1.5 py-1 rounded text-left text-xs;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.trace-search__func {
  @apply font-mono font-medium text-gray-900 dark:text-gray-100 break-all;
}

.trace-search__where {
  @apply font-mono text-gray-500 dark:text-gray-400;
}

.trace-search__time {
  @apply ml-auto font-mono tabular-nums text-gray-600 dark:text-gray-300;
}

.trace-search__more {
  @apply self-start text-xs;
}
</style>
