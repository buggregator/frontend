<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'

type Props = {
  title?: string
  date?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  date: null
})

const formattedDate = computed(() =>
  props.date ? moment(props.date).format('DD.MM.YYYY HH:mm:ss') : ''
)
</script>

<template>
  <div class="event-detail">
    <header
      v-if="title || $slots.header"
      class="event-detail__header"
    >
      <slot name="header">
        <div class="event-detail__header-content">
          <h2 class="event-detail__title">
            {{ title }}
          </h2>
          <span
            v-if="formattedDate"
            class="event-detail__date"
          >
            {{ formattedDate }}
          </span>
        </div>
      </slot>
    </header>

    <div class="event-detail__body">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.event-detail {
  @apply relative flex flex-col h-full;
}

.event-detail__header {
  @apply bg-gray-50 dark:bg-gray-900 py-5 px-5 md:px-6 lg:px-8;
  @apply border-b border-gray-200 dark:border-gray-700/50;
}

.event-detail__header-content {
  @apply flex flex-col md:flex-row md:items-center md:justify-between gap-2;
}

.event-detail__title {
  @apply text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words;
}

.event-detail__date {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap;
}

.event-detail__body {
  @apply flex flex-col flex-grow py-5 px-5 md:px-6 lg:px-8 gap-6;
}
</style>
