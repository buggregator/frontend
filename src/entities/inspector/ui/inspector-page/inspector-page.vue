<script lang="ts" setup>
import moment from 'moment/moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { TableBase, TableBaseRow } from '@/shared/ui'
import type { Inspector, InspectorTransaction } from '../../types'
import { InspectorPageTimeline } from '../inspector-page-timeline'
import { InspectorStatBoard } from '../inspector-stat-board'

type Props = {
  event: NormalizedEvent<Inspector>
}

const props = defineProps<Props>()

const transaction = computed(() => props.event?.payload[0])

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))

const http = computed(() =>
  transaction.value ? (transaction.value as InspectorTransaction)?.http : undefined
)
</script>

<template>
  <div
    ref="main"
    class="inspector-page"
  >
    <main class="inspector-page__in">
      <header class="inspector-page__header">
        <h2 class="inspector-page__header-title">
          {{ transaction.name }}
        </h2>
        <div class="inspector-page__header-meta">
          <span class="inspector-page__header-date">{{ date }}</span>
        </div>
      </header>

      <InspectorStatBoard :transaction="transaction" />
      <InspectorPageTimeline :payload="event.payload" />

      <section class="inspector-page__body">
        <h3 class="inspector-page__body-text">
          Url
        </h3>
        <TableBase class="inspector-page__body-table">
          <TableBaseRow
            v-for="(value, name) in http?.url"
            :key="name"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section>
        <h3 class="inspector-page__body-text">
          Request
        </h3>
        <TableBase class="inspector-page__body-table">
          <TableBaseRow
            v-for="(value, name) in http?.request"
            :key="name"
            :title="String(name)"
          >
            <template v-if="typeof value === 'string'">
              {{ value }}
            </template>
            <template v-else-if="Array.isArray(value)">
              {{ value.join(', ') }}
            </template>
            <template v-else-if="!Array.isArray(value)">
              <TableBaseRow
                v-for="(v, n) in value"
                :key="n"
                :title="String(n)"
              >
                {{ v }}
              </TableBaseRow>
            </template>
          </TableBaseRow>
        </TableBase>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.inspector-page {
  @apply relative;
}

.inspector-page__in {
  @apply flex flex-col h-full flex-grow py-5 px-4 md:px-6 lg:px-8;
}

.inspector-page__header {
  @apply flex flex-col md:flex-row justify-between items-center mb-5;
}

.inspector-page__header-meta {
  @apply flex flex-col md:flex-row items-center gap-x-5;
}

.inspector-page__header-title {
  @apply text-sm sm:text-base md:text-lg lg:text-2xl;
}

.inspector-page__header-date {
  @include text-muted;
  @apply text-sm font-semibold;
}

.inspector-page__body {
  @apply py-5;
}

.inspector-page__body-text {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.inspector-page__body-table {
  @apply mt-3;
}
</style>
