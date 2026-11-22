<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, useId } from 'vue'
import type { FacetOption } from './types'

// «Channel: all 8 ▾»: picks values of one facet with their counts. None
// picked means all of them. The popover is a list of checkboxes: Tab, Space
// and Esc work as everywhere.

type Props = {
  label: string
  options: FacetOption[]
}

const props = defineProps<Props>()
const model = defineModel<string[]>({ default: () => [] })

const uid = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

// A picked value the counts no longer have stays in the list, to be unpicked.
const list = computed<FacetOption[]>(() => {
  const known = new Set(props.options.map((o) => o.value))
  return [
    ...props.options,
    ...model.value.filter((v) => !known.has(v)).map((value) => ({ value, count: 0 }))
  ]
})

const summary = computed(() => {
  const picked = model.value
  if (!picked.length) return `all ${props.options.length}`
  if (picked.length === 1) return picked[0]
  return `${picked.length} of ${list.value.length}`
})

const isPicked = (value: string) => model.value.includes(value)
const toggle = (value: string) => {
  model.value = isPicked(value) ? model.value.filter((v) => v !== value) : [...model.value, value]
}
const reset = () => (model.value = [])

const show = async () => {
  open.value = true
  await nextTick()
  panel.value?.querySelector<HTMLInputElement>('input')?.focus()
}
const close = (refocus = true) => {
  if (!open.value) return
  open.value = false
  if (refocus) nextTick(() => button.value?.focus())
}

onClickOutside(root, () => close(false))
const onFocusOut = (e: FocusEvent) => {
  const next = e.relatedTarget as Node | null
  if (next && !root.value?.contains(next)) close(false)
}
</script>

<template>
  <div
    ref="root"
    class="facet-picker"
    @keydown.esc="open && ($event.stopPropagation(), close())"
    @focusout="onFocusOut"
  >
    <button
      ref="button"
      type="button"
      class="facet-picker__button"
      :class="{ 'facet-picker__button--on': model.length > 0 }"
      :aria-expanded="open"
      :aria-controls="open ? `${uid}-panel` : undefined"
      :aria-label="`${label}: ${summary}`"
      data-test="facet-picker-button"
      @click="open ? close() : show()"
    >
      <span class="facet-picker__label">{{ label }}</span>
      <span class="facet-picker__value">{{ summary }}</span>
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>

    <div
      v-if="open"
      :id="`${uid}-panel`"
      ref="panel"
      class="facet-picker__panel"
      role="group"
      :aria-label="label"
      data-test="facet-picker-panel"
    >
      <button
        type="button"
        class="facet-picker__all"
        :disabled="!model.length"
        @click="reset"
      >
        All {{ label.toLowerCase() }}s
      </button>
      <p
        v-if="!list.length"
        class="facet-picker__none"
      >
        Nothing to pick
      </p>
      <label
        v-for="o in list"
        :key="o.value"
        class="facet-picker__option"
      >
        <input
          type="checkbox"
          class="facet-picker__check"
          :checked="isPicked(o.value)"
          :value="o.value"
          @change="toggle(o.value)"
        >
        <span class="facet-picker__name">{{ o.value }}</span>
        <span class="facet-picker__count">{{ o.count }}</span>
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.facet-picker {
  @apply relative flex;
}

.facet-picker__button {
  @apply inline-flex items-center gap-1.5 h-7 px-2 rounded whitespace-nowrap;
  @apply text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;

  &[aria-expanded='true'] {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.facet-picker__label {
  @apply text-gray-500 dark:text-gray-400;
}

.facet-picker__value {
  @apply font-medium max-w-[10rem] truncate;
}

.facet-picker__button--on .facet-picker__value {
  @apply text-blue-700 dark:text-blue-300;
}

.facet-picker__panel {
  @apply absolute left-0 top-full mt-1 z-30 flex flex-col py-1 min-w-[12rem];
  @apply max-h-72 overflow-y-auto rounded-md shadow-lg;
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  max-width: calc(100vw - 2rem);
}

.facet-picker__all {
  @apply mx-1 mb-1 px-2 py-1 rounded text-left text-xs;
  @apply text-blue-700 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700;

  &:disabled {
    @apply text-gray-400 dark:text-gray-500 hover:bg-transparent cursor-default;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.facet-picker__none {
  @apply px-3 py-1 text-xs text-gray-500 dark:text-gray-400;
}

.facet-picker__option {
  @apply flex items-center gap-2 px-3 py-1 text-xs cursor-pointer;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700;

  &:focus-within {
    @apply bg-gray-100 dark:bg-gray-700;
  }
}

.facet-picker__check {
  @apply w-3.5 h-3.5 accent-blue-600;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.facet-picker__name {
  @apply flex-1 truncate font-mono;
}

.facet-picker__count {
  @apply font-mono tabular-nums text-gray-500 dark:text-gray-400;
}
</style>
