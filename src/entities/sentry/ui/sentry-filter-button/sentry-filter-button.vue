<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, useId, watch } from 'vue'
import { activeSentryFilters, type SentryTab } from '../../lib/use-sentry-filters'

// The funnel button of the Sentry header (#5980), in the filter bar of row 2 (#6737 A). Its popover holds the open
// tab's own settings; changes apply at once. Loaded on first open: the Sentry
// entity's styles are part of the first page load.
const SentryFilterPanel = defineAsyncComponent(() => import('./sentry-filter-panel.vue'))

const props = defineProps<{ tab: SentryTab }>()

const NAMES: Record<SentryTab, string> = {
  exceptions: 'Exceptions',
  traces: 'Traces',
  logs: 'Logs',
  metrics: 'Metrics',
  feedback: 'Feedback',
  crons: 'Crons',
  queues: 'Queues'
}

const uid = useId()
const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)

const name = computed(() => NAMES[props.tab])
const active = computed(() => activeSentryFilters(props.tab))
const label = computed(
  () => `Filters for ${name.value}${active.value ? `, ${active.value} on` : ''}`
)

const close = (refocus = true) => {
  if (!isOpen.value) return
  isOpen.value = false
  if (refocus) button.value?.focus()
}
const toggle = () => (isOpen.value ? close() : (isOpen.value = true))

onClickOutside(root, () => close(false))

// Focus left the button and the popover (Tab past the last control).
const onFocusOut = (e: FocusEvent) => {
  const next = e.relatedTarget as Node | null
  if (next && !root.value?.contains(next)) close(false)
}

// Another tab: its own settings, closed.
watch(
  () => props.tab,
  () => close(false)
)
</script>

<template>
  <div
    ref="root"
    class="sentry-filter"
    @keydown.esc.stop.prevent="close()"
    @focusout="onFocusOut"
  >
    <button
      ref="button"
      type="button"
      class="sentry-filter__btn"
      :class="{ 'sentry-filter__btn--on': active > 0 }"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? `${uid}-panel` : undefined"
      :aria-label="label"
      title="Filters"
      data-test="sentry-filter-button"
      @click="toggle"
    >
      <svg
        class="sentry-filter__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          d="M2 3h12l-4.5 5.5V13l-3-1.5v-3z"
          stroke-linejoin="round"
        />
      </svg>
      <span
        v-if="active"
        class="sentry-filter__badge"
        aria-hidden="true"
        data-test="sentry-filter-badge"
      >{{ active }}</span>
    </button>

    <SentryFilterPanel
      v-if="isOpen"
      :id="`${uid}-panel`"
      :tab="tab"
      :name="name"
      @close="close()"
    />
  </div>
</template>

<style lang="scss" scoped>
.sentry-filter {
  @apply relative flex;
}

.sentry-filter__btn {
  @apply relative inline-flex items-center justify-center gap-1.5 h-7 min-w-7 px-[7px] rounded;
  @apply text-xs font-medium;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;

  &[aria-expanded='true'] {
    @apply bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.sentry-filter__btn--on {
  @apply text-gray-900 dark:text-gray-100;
}

.sentry-filter__icon {
  @apply w-3.5 h-3.5;
}

.sentry-filter__badge {
  @apply min-w-4 h-4 px-1 rounded-full text-center;
  @apply bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

// Phone: a 44 px tap area with the 28 px look of the header row (as Period).
@media (max-width: 639px) {
  .sentry-filter__btn {
    @apply h-11 min-w-11 p-2 bg-clip-content;
  }
}
</style>
