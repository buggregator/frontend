<script lang="ts" setup>
import moment from 'moment/moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { CodeSnippet, TableBase, TableBaseRow } from '@/shared/ui'
import type { Monolog } from '../../types'

type Props = {
  event: NormalizedEvent<Monolog>
}

const props = defineProps<Props>()

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))
</script>

<template>
  <div ref="main" class="monolog">
    <main class="monolog__in">
      <header class="monolog__header">
        <h2 class="monolog__header-title">Channel: {{ event.payload.channel }}</h2>
        <div class="monolog__header-meta">
          <span class="monolog__header-date">{{ date }}</span>
        </div>
      </header>

      <CodeSnippet class="monolog__body" :code="event.payload.message" />

      <CodeSnippet
        v-if="event.payload.context"
        class="monolog__body"
        language="json"
        :code="event.payload.context"
      />

      <template v-if="event.payload.extra && event.payload.extra.length">
        <CodeSnippet
          v-for="(field, key) in event.payload.extra"
          :key="key"
          class="monolog__body"
          :code="{ [key]: String(field) }"
        />
      </template>

      <section v-if="event.payload.context.source" class="monolog__body">
        <h3 class="monolog__body-text">Source</h3>
        <TableBase class="monolog__body-table">
          <TableBaseRow
            v-for="(value, name) in event.payload.context.source"
            :key="name"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section v-if="event.payload.context.request" class="monolog__body">
        <h3 class="monolog__body-text">Request</h3>
        <TableBase class="monolog__body-table">
          <template v-for="(value, name) in event.payload.context.request" :key="name">
            <TableBaseRow v-if="name && value" :title="String(name)">
              {{ value }}
            </TableBaseRow>
          </template>
        </TableBase>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.monolog {
  @apply relative;
}

.monolog__in {
  @apply flex flex-col h-full flex-grow py-5 px-4 md:px-6 lg:px-8;
}

.monolog__header {
  @apply flex flex-col md:flex-row justify-between items-center;
}

.monolog__header-meta {
  @apply flex flex-col md:flex-row items-center gap-x-5;
}

.monolog__header-title {
  @apply text-sm sm:text-base md:text-lg lg:text-2xl;
}

.monolog__header-date {
  @include text-muted;
  @apply text-sm font-semibold;
}

.monolog__body {
  @apply py-5;
}

.monolog__body-text {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.monolog__body-table {
  @apply mt-3;
}
</style>
