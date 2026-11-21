<script lang="ts" setup>
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { computed, ref, useId, useTemplateRef } from 'vue'
import { symbolLabel } from '../../lib/symbol-label'
import { useCodeGraphRequests } from '../../lib/use-code-graph-requests'
import type { CodeSymbol } from '../../types'

// Find a symbol by name (`/` focuses the field): a combobox, arrows move,
// Enter picks, Esc closes.

const props = defineProps<{ root?: string }>()
const emit = defineEmits<{ (e: 'pick', symbol: CodeSymbol): void }>()

const uid = useId()
const input = useTemplateRef<HTMLInputElement>('input')
const q = ref('')
const results = ref<CodeSymbol[]>([])
const open = ref(false)
const active = ref(0)
const loading = ref(false)
const failed = ref(false)

const api = useCodeGraphRequests()
let seq = 0
const run = useDebounceFn(async (text: string) => {
  const mine = ++seq
  if (text.trim().length < 2) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  failed.value = false
  try {
    const found = await api.search(text.trim(), { root: props.root, limit: 20 })
    if (mine !== seq) return
    results.value = found
    active.value = 0
  } catch {
    if (mine === seq) failed.value = true
  } finally {
    if (mine === seq) loading.value = false
  }
}, 150)

const onInput = () => {
  open.value = true
  run(q.value)
}

const pick = (s: CodeSymbol | undefined) => {
  if (!s) return
  emit('pick', s)
  open.value = false
  q.value = ''
  results.value = []
  input.value?.blur()
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    open.value = true
    active.value = Math.min(active.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pick(results.value[active.value])
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

// `/` from anywhere outside a text field.
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
  e.preventDefault()
  input.value?.focus()
})

const listId = `${uid}-list`
const optionId = (i: number) => `${uid}-opt-${i}`
const showList = computed(() => open.value && q.value.trim().length >= 2)
const label = (s: CodeSymbol) => symbolLabel(s)
</script>

<template>
  <div class="cg-search">
    <input
      ref="input"
      v-model="q"
      type="search"
      class="cg-search__input"
      placeholder="Find a class, method or function"
      aria-label="Find a symbol"
      role="combobox"
      :aria-expanded="showList"
      :aria-controls="listId"
      :aria-activedescendant="showList && results.length ? optionId(active) : undefined"
      aria-autocomplete="list"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="open = true"
      @blur="open = false"
      @keydown="onKeydown"
    >
    <kbd
      class="cg-search__key"
      aria-hidden="true"
    >/</kbd>
    <ul
      v-show="showList"
      :id="listId"
      class="cg-search__list"
      role="listbox"
      aria-label="Symbols"
    >
      <li
        v-for="(s, i) in results"
        :id="optionId(i)"
        :key="s.id"
        role="option"
        :aria-selected="i === active"
        class="cg-search__opt"
        :class="{ 'cg-search__opt--active': i === active }"
        @mousedown.prevent="pick(s)"
        @mousemove="active = i"
      >
        <span class="cg-search__name">{{ label(s).name }}</span>
        <span class="cg-search__owner">{{ label(s).owner }}</span>
        <span class="cg-search__kind">{{ s.kind }}</span>
      </li>
      <li
        v-if="!results.length"
        class="cg-search__empty"
        role="presentation"
      >
        {{ loading ? 'Searching…' : failed ? 'Search failed. Try again.' : 'Nothing found' }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.cg-search {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.cg-search__input {
  width: 100%;
  height: 34px;
  padding: 0 32px 0 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;

  @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
}

.cg-search__input:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 1px;
}

.cg-search__key {
  position: absolute;
  top: 7px;
  right: 8px;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 11px;

  @apply border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400;
}

.cg-search__list {
  position: absolute;
  z-index: 30;
  top: 38px;
  left: 0;
  right: 0;
  max-height: 360px;
  overflow: auto;
  border-radius: 4px;
  padding: 4px 0;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);

  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600;
}

.cg-search__opt {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-height: 32px;
  padding: 6px 10px;
  cursor: pointer;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
}

.cg-search__opt--active {
  @apply bg-gray-100 dark:bg-gray-700;
}

.cg-search__name {
  font-weight: 600;

  @apply text-gray-900 dark:text-gray-100;
}

.cg-search__owner {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @apply text-gray-600 dark:text-gray-400;
}

.cg-search__kind {
  font-size: 11px;

  @apply text-gray-600 dark:text-gray-400;
}

.cg-search__empty {
  padding: 8px 10px;
  font-size: 12px;

  @apply text-gray-600 dark:text-gray-400;
}
</style>
