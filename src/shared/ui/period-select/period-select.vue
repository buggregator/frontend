<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useEventsStore, PERIOD_OPTIONS } from '../../stores'
import { IconSvg } from '../icon-svg'

// Period selector.
//
// The value is sent to the backend as ?window= and bounds lists by time.
// Without it the server returns everything stored for the project — tens of
// megabytes of JSON in a single response on a busy instance — and finding an
// event from a particular hour means scrolling an endless list.
//
// With v-model it is a plain control for a page that keeps its own period
// (the Logs page keeps it in the URL); without, it is the feed's period.
type Props = { modelValue?: string }

const props = withDefaults(defineProps<Props>(), { modelValue: undefined })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const eventsStore = useEventsStore()
const { period } = storeToRefs(eventsStore)

const selected = computed({
  get: () => props.modelValue ?? period.value,
  set: (value: string) =>
    props.modelValue === undefined ? eventsStore.setPeriod(value) : emit('update:modelValue', value)
})
</script>

<template>
  <label class="period-select">
    <span class="period-select__label">Period</span>
    <select
      v-model="selected"
      class="period-select__control"
      aria-label="Period"
    >
      <option
        v-for="option in PERIOD_OPTIONS"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <!-- Phone: the select draws no arrow of its own there. -->
    <IconSvg
      class="period-select__chevron"
      name="collapsed"
    />
  </label>
</template>

<style lang="scss" scoped>
.period-select {
  @apply relative flex flex-none items-center gap-1.5;
}

.period-select__label {
  @apply hidden sm:inline;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.period-select__control {
  @apply h-7 px-2 rounded;
  @apply text-xs;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-700 dark:text-gray-200;
  @apply border-0 outline-none cursor-pointer;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors;

  // Phones: drawn as the row's «Filters» button (38 px, outlined, 6 px
  // corners) with its own arrow; the native one looked out of the kit.
  // 38 px + the row's 3 px above and below give the 44 px tap height.
  @media (max-width: 639px) {
    @apply appearance-none bg-transparent dark:bg-transparent;
    @apply hover:bg-gray-100 dark:hover:bg-gray-800;
    height: 38px;
    padding: 0 30px 0 12px;
    border: 1px solid #6b7280;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    @apply text-gray-800 dark:text-gray-100;

    &:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 1px;
    }
  }
}

.period-select__chevron {
  @apply hidden;

  @media (max-width: 639px) {
    @apply block absolute w-3.5 h-3.5 pointer-events-none;
    @apply text-gray-500 dark:text-gray-400;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>
