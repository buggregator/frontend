<script lang="ts" setup>
type Props = {
  title?: string
  count?: number
}

withDefaults(defineProps<Props>(), {
  title: '',
  count: 0
})
</script>

<template>
  <section
    v-if="$slots.default"
    class="event-section"
  >
    <h3
      v-if="title"
      class="event-section__title"
    >
      {{ title }}
      <span
        v-if="count > 0"
        class="event-section__count"
      >
        {{ count }}
      </span>
    </h3>
    <div class="event-section__content">
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.event-section__title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply mb-3;
}

.event-section__count {
  @apply bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-100;
  @apply rounded-full text-xs px-2 py-0.5 ml-2;
  @apply font-sans;
}

.event-section__content {
  @apply flex flex-col;
}
</style>
