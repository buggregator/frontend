<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  activeSentryFilters,
  resetSentryFilters,
  SENTRY_FILTER_GROUPS,
  useSentryFilters,
  type SentryFilterGroup,
  type SentryTab
} from '../../lib/use-sentry-filters'

// The popover of the Sentry filter button (#5980), loaded on first open.
const props = defineProps<{ tab: SentryTab; name: string; id: string }>()
const emit = defineEmits<{ close: [] }>()

const LEVEL_COLORS: Record<string, string> = {
  fatal: '#dc2626',
  error: '#ef4444',
  warning: '#f59e0b',
  warn: '#f59e0b',
  info: '#3b82f6',
  debug: '#9ca3af'
}

const state = useSentryFilters()
const uid = props.id
const panel = ref<HTMLElement | null>(null)
const groups = computed(() => SENTRY_FILTER_GROUPS[props.tab])
const active = computed(() => activeSentryFilters(props.tab))

const focusFirst = () => {
  const el = panel.value?.querySelector<HTMLElement>('[role="radio"][tabindex="0"], input')
  el?.focus()
}
onMounted(focusFirst)

const select = (group: SentryFilterGroup, value: string) => {
  state[group.key] = value
}

// Radio group: ↑↓ (and ←→) move and select, as native radios do.
const onRadioKey = async (e: KeyboardEvent, group: SentryFilterGroup) => {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
  if (!step || !group.options) return
  e.preventDefault()
  const values = group.options.map((o) => o.value)
  const i = values.indexOf(state[group.key])
  select(group, values[(i + step + values.length) % values.length])
  await nextTick()
  panel.value
    ?.querySelector<HTMLElement>(`[data-group="${group.key}"] [aria-checked="true"]`)
    ?.focus()
}

const reset = () => {
  resetSentryFilters(props.tab)
  focusFirst()
}
</script>

<template>
  <div class="sentry-filter-panel">
    <div
      class="sentry-filter__scrim"
      aria-hidden="true"
      @click="emit('close')"
    />
    <div
      :id="id"
      ref="panel"
      class="sentry-filter__panel"
      role="dialog"
      :aria-label="`Filters for ${name}`"
      data-test="sentry-filter-panel"
    >
      <div class="sentry-filter__sheet-head">
        <span class="sentry-filter__sheet-title">Filters · {{ name }}</span>
        <button
          type="button"
          class="sentry-filter__close"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div
        v-for="group in groups"
        :key="group.key"
        class="sentry-filter__group"
        :data-group="group.key"
      >
        <h3
          :id="`${uid}-${group.key}`"
          class="sentry-filter__heading"
        >
          {{ group.title }}
        </h3>

        <div
          v-if="group.options"
          role="radiogroup"
          :aria-labelledby="`${uid}-${group.key}`"
        >
          <button
            v-for="opt in group.options"
            :key="opt.value"
            type="button"
            role="radio"
            class="sentry-filter__opt"
            :aria-checked="state[group.key] === opt.value"
            :tabindex="state[group.key] === opt.value ? 0 : -1"
            :data-value="opt.value"
            @click="select(group, opt.value)"
            @keydown="onRadioKey($event, group)"
          >
            <svg
              class="sentry-filter__check"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path d="m3 8.5 3 3 7-7" />
            </svg>
            <span
              v-if="opt.level"
              class="sentry-filter__level"
              :style="{ background: LEVEL_COLORS[opt.level] }"
              aria-hidden="true"
            />
            {{ opt.label }}
            <span
              v-if="opt.hint"
              class="sentry-filter__hint"
            >{{ opt.hint }}</span>
          </button>
        </div>

        <label
          v-else
          class="sentry-filter__search"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
            />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            v-model="state[group.key]"
            type="search"
            placeholder="Filter by name"
            :aria-labelledby="`${uid}-${group.key}`"
            spellcheck="false"
            autocomplete="off"
          >
        </label>
      </div>

      <div class="sentry-filter__foot">
        <span>Applies at once · remembered</span>
        <button
          type="button"
          class="sentry-filter__reset"
          :disabled="!active"
          data-test="sentry-filter-reset"
          @click="reset"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-filter__scrim {
  @apply hidden;
}

.sentry-filter__panel {
  @apply absolute right-0 top-full mt-2 z-popover w-72 py-1;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700 rounded-md;
  box-shadow: 0 8px 24px rgb(17 24 39 / 12%);

  .dark & {
    box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
  }
}

.sentry-filter__sheet-head {
  @apply hidden items-center justify-between pl-4 pr-2 pt-2 pb-1;
}

.sentry-filter__sheet-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

.sentry-filter__close {
  @apply flex items-center justify-center w-11 h-11 rounded text-gray-600 dark:text-gray-400;

  svg {
    @apply w-4 h-4;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.sentry-filter__group {
  @apply pb-1.5 border-b border-gray-200 dark:border-gray-700;

  &:last-of-type {
    @apply border-b-0;
  }
}

.sentry-filter__heading {
  @apply px-3 pt-2.5 pb-1 text-xs font-medium text-gray-600 dark:text-gray-400;
}

.sentry-filter__opt {
  @apply flex items-center gap-2.5 w-full h-8 px-3 text-left text-sm;
  @apply text-gray-800 dark:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;

  &[aria-checked='true'] {
    @apply font-medium text-gray-900 dark:text-gray-100;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-600 dark:ring-blue-400;
  }
}

.sentry-filter__check {
  @apply w-3.5 h-3.5 flex-none invisible;

  [aria-checked='true'] > & {
    @apply visible;
  }
}

.sentry-filter__level {
  @apply w-2 h-2 rounded-sm flex-none;
}

.sentry-filter__hint {
  @apply ml-auto text-xs font-normal text-gray-500 dark:text-gray-400;
}

.sentry-filter__search {
  @apply flex items-center gap-1.5 h-8 mx-3 mt-0.5 mb-2 px-2 rounded;
  @apply border border-gray-500 dark:border-gray-400;
  @apply text-gray-500 dark:text-gray-400;

  &:focus-within {
    @apply ring-2 ring-blue-600 dark:ring-blue-400;
  }

  svg {
    @apply w-3.5 h-3.5 flex-none;
  }

  input {
    @apply flex-1 min-w-0 bg-transparent border-0 p-0 text-sm outline-none;
    @apply text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400;
  }
}

.sentry-filter__foot {
  @apply flex items-center justify-between px-3 pt-2 pb-1.5;
  @apply border-t border-gray-200 dark:border-gray-700;
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.sentry-filter__reset {
  @apply py-1 text-blue-600 dark:text-blue-300 underline underline-offset-2;
  font-size: 13px;
  font-weight: 500;

  &:disabled {
    @apply text-gray-500 dark:text-gray-400 no-underline cursor-default;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400 rounded-sm;
  }
}

// Phone: a bottom sheet over a scrim, 44 px rows.
@media (max-width: 639px) {
  .sentry-filter__scrim {
    @apply block fixed inset-0 z-overlay;
    background: rgb(3 7 18 / 50%);
  }

  .sentry-filter__panel {
    @apply fixed inset-x-0 bottom-0 top-auto mt-0 w-auto z-[calc(var(--z-overlay)+1)];
    @apply rounded-b-none border-b-0 pb-4 overflow-auto;
    border-radius: 12px 12px 0 0;
    max-height: 80vh;
  }

  .sentry-filter__sheet-head {
    @apply flex;
  }

  .sentry-filter__opt,
  .sentry-filter__search {
    @apply h-11;
  }

  .sentry-filter__reset {
    @apply min-h-11 min-w-11 text-right;
  }
}
</style>
