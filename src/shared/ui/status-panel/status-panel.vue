<script lang="ts" setup>
// One place for "this list could not load" and "nothing here, and why".
// An error is announced (role="alert"); an empty state is not.
type Props = {
  tone?: 'error' | 'empty'
  title: string
  text?: string
  actionLabel?: string
  // Over other content (a list that is still shown): less room.
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'empty',
  text: '',
  actionLabel: ''
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <section
    class="status-panel"
    :class="[`status-panel--${props.tone}`, { 'status-panel--compact': props.compact }]"
    :role="props.tone === 'error' ? 'alert' : undefined"
  >
    <h2 class="status-panel__title">
      {{ props.title }}
    </h2>
    <p
      v-if="props.text"
      class="status-panel__text"
    >
      {{ props.text }}
    </p>
    <slot />
    <button
      v-if="props.actionLabel"
      type="button"
      class="status-panel__action"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </button>
  </section>
</template>

<style lang="scss" scoped>
.status-panel {
  @apply flex flex-col items-center justify-center gap-3 text-center;
  @apply px-4 py-16 mx-auto max-w-md;
}

.status-panel--compact {
  @apply py-4;
}

.status-panel__title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

.status-panel--error .status-panel--compact {
  @apply py-4;
}

.status-panel__title {
  @apply text-red-700 dark:text-red-400;
}

.status-panel__text {
  @apply text-sm text-gray-600 dark:text-gray-300 break-words;
}

.status-panel__action {
  @apply px-3 py-1.5 rounded-md text-sm font-medium;
  @apply bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900;
  @apply hover:bg-gray-700 dark:hover:bg-white transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}
</style>
