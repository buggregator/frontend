<script lang="ts" setup>
import { useId } from 'vue'

// One line of a dense list that unfolds in place: a log line of Sentry Logs
// and of the Logs page. A click anywhere on the line, or Enter / Space on it,
// toggles it. Links and buttons of the line go in `actions`, outside the
// toggle, so they work on their own; what unfolds goes in `details`.
const expanded = defineModel<boolean>('expanded', { default: false })

const uid = useId()
const toggle = () => (expanded.value = !expanded.value)
</script>

<template>
  <div
    class="expandable-row"
    :class="{ 'expandable-row--expanded': expanded }"
    @click="toggle"
  >
    <div class="expandable-row__main">
      <div
        class="expandable-row__toggle"
        role="button"
        tabindex="0"
        :aria-expanded="expanded"
        :aria-controls="expanded && $slots.details ? `${uid}-details` : undefined"
        data-test="expandable-row-toggle"
        @keydown.enter.self.prevent="toggle"
        @keydown.space.self.prevent="toggle"
      >
        <slot />
      </div>
      <div
        v-if="$slots.actions"
        class="expandable-row__actions"
        @click.stop
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="expanded && $slots.details"
      :id="`${uid}-details`"
      class="expandable-row__details"
      @click.stop
    >
      <slot name="details" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.expandable-row {
  @apply px-3 py-2 cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply transition-colors duration-100;
}

.expandable-row:hover,
.expandable-row--expanded {
  @apply bg-gray-50 dark:bg-gray-900;
}

.expandable-row__main {
  @apply flex items-center gap-2;
}

.expandable-row__toggle {
  @apply flex flex-1 items-center gap-2 min-w-0 rounded-sm;

  &:focus-visible {
    outline: 2px solid theme('colors.blue.600');
    outline-offset: 2px;
  }

  &:focus-visible:is(.dark *) {
    outline-color: theme('colors.blue.400');
  }
}

.expandable-row__actions {
  @apply flex flex-shrink-0 items-center gap-1.5;
}

.expandable-row__details {
  @apply mt-2 cursor-auto;
}
</style>
