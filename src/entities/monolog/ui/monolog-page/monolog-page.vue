<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import {
  CodeSnippet,
  TableBase,
  TableBaseRow,
  EventDetailLayout,
  EventDetailSection
} from '@/shared/ui'
import { MonologLevel } from '../../types'
import type { Monolog } from '../../types'

type Props = {
  event: NormalizedEvent<Monolog>
}

const props = defineProps<Props>()

const levelBadgeClass = computed(() => {
  const level = props.event.payload.level
  if (level >= MonologLevel.EMERGENCY) return 'level-badge--emergency'
  if (level >= MonologLevel.ALERT) return 'level-badge--alert'
  if (level >= MonologLevel.CRITICAL) return 'level-badge--critical'
  if (level >= MonologLevel.ERROR) return 'level-badge--error'
  if (level >= MonologLevel.WARNING) return 'level-badge--warning'
  if (level >= MonologLevel.NOTICE) return 'level-badge--notice'
  if (level >= MonologLevel.INFO) return 'level-badge--info'
  return 'level-badge--debug'
})
</script>

<template>
  <EventDetailLayout
    :title="`Channel: ${event.payload.channel}`"
    :date="event.date"
  >
    <template #header>
      <div class="monolog-page-header">
        <div class="monolog-page-header__top">
          <h2 class="monolog-page-header__title">
            Channel: {{ event.payload.channel }}
          </h2>
          <span
            class="level-badge"
            :class="levelBadgeClass"
          >
            {{ event.payload.level_name }}
          </span>
        </div>
      </div>
    </template>

    <EventDetailSection title="Message">
      <CodeSnippet :code="event.payload.message" />
    </EventDetailSection>

    <EventDetailSection
      v-if="event.payload.context"
      title="Context"
    >
      <CodeSnippet
        language="json"
        :code="event.payload.context"
      />
    </EventDetailSection>

    <template v-if="event.payload.extra && event.payload.extra.length">
      <EventDetailSection
        v-for="(field, key) in event.payload.extra"
        :key="key"
        title="Extra"
      >
        <CodeSnippet :code="{ [key]: String(field) }" />
      </EventDetailSection>
    </template>

    <EventDetailSection
      v-if="event.payload.context.source"
      title="Source"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in event.payload.context.source"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <EventDetailSection
      v-if="event.payload.context.request"
      title="Request"
    >
      <TableBase>
        <template
          v-for="(value, name) in event.payload.context.request"
          :key="name"
        >
          <TableBaseRow
            v-if="name && value"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </template>
      </TableBase>
    </EventDetailSection>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.monolog-page-header {
  @apply flex flex-col gap-2;
}

.monolog-page-header__top {
  @apply flex flex-col md:flex-row md:items-center gap-2;
}

.monolog-page-header__title {
  @apply text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words;
}

.level-badge {
  @apply inline-flex self-start items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide;
}

.level-badge--debug {
  @apply text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/50;
}

.level-badge--info {
  @apply text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10;
}

.level-badge--notice {
  @apply text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10;
}

.level-badge--warning {
  @apply text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10;
}

.level-badge--error {
  @apply text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10;
}

.level-badge--critical {
  @apply text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20;
}

.level-badge--alert {
  @apply text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10;
}

.level-badge--emergency {
  @apply text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20;
  animation: pulse-emergency 2s ease-in-out infinite;
}

@keyframes pulse-emergency {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
