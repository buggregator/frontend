<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import {
  TableBase,
  TableBaseRow,
  EventDetailLayout,
  EventDetailSection
} from '@/shared/ui'
import { hasEntries, jsonOpenDepth } from '../../lib'
import type { Monolog } from '../../types'
import { MonologBody } from '../monolog-body'
import { MonologLevelBadge } from '../monolog-level'

type Props = {
  event: NormalizedEvent<Monolog>
}

const props = defineProps<Props>()

const hasExtra = computed(() => hasEntries(props.event.payload.extra))
const hasContext = computed(() => hasEntries(props.event.payload.context))
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
          <MonologLevelBadge
            :level="event.payload.level"
            :name="event.payload.level_name"
          />
        </div>
      </div>
    </template>

    <!-- One box, as in the feed: the message, then context and extra. -->
    <EventDetailSection title="Message">
      <MonologBody
        :message="event.payload.message"
        :context="hasContext ? event.payload.context : null"
        :extra="hasExtra ? event.payload.extra : null"
        :context-depth="jsonOpenDepth(event.payload.context)"
        :extra-depth="jsonOpenDepth(event.payload.extra)"
      />
    </EventDetailSection>

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
</style>
