<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useEventsStore, PERIOD_OPTIONS } from '../../stores'

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
  </label>
</template>

<style lang="scss" scoped>
.period-select {
  @apply flex items-center gap-1.5;
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

  // Phones: a 44 px tall control painted 38 px, as the other controls of
  // the header's row 2 (the padding stays outside the painted background).
  @media (max-width: 639px) {
    @apply h-11 py-[3px] bg-clip-content;
  }
}
</style>
