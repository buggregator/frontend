<script lang="ts" setup>
import moment from 'moment/moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { TableBase, TableBaseRow, ValueDump } from '@/shared/ui'
import type { VarDump } from '../../types'

type Props = {
  event: NormalizedEvent<VarDump>
}

const props = defineProps<Props>()

const title = computed(() => {
  const type = String(props.event.payload.payload.type || 'Unknown type')

  return type[0].toUpperCase() + type.slice(1)
})

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))
</script>

<template>
  <div
    ref="main"
    class="var-dump"
  >
    <main class="var-dump__in">
      <header class="var-dump__header">
        <h2 class="var-dump__header-title">
          {{ title }}
        </h2>
        <div class="var-dump__header-meta">
          <span class="var-dump__header-date">{{ date }}</span>
        </div>
      </header>

      <section class="var-dump__body">
        <ValueDump
          :value="event.payload.payload.value"
          :type="event.payload.payload.type"
        />
      </section>

      <section
        v-if="event.payload.context.source"
        class="var-dump__body"
      >
        <h3 class="var-dump__body-text">
          Source
        </h3>
        <TableBase class="var-dump__body-table">
          <TableBaseRow
            v-for="(value, name) in event.payload.context.source"
            :key="name"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section
        v-if="event.payload.context.request"
        class="var-dump__body"
      >
        <h3 class="var-dump__body-text">
          Request
        </h3>
        <TableBase class="var-dump__body-table">
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
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/assets/mixins' as mixins;

.var-dump {
  @apply relative;
}

.var-dump__in {
  @apply flex flex-col h-full flex-grow py-5 px-3 md:px-4 lg:px-5;
}

.var-dump__header {
  @apply flex flex-col md:flex-row justify-between items-center;
}

.var-dump__header-meta {
  @apply flex flex-col md:flex-row items-center gap-x-5;
}

.var-dump__header-title {
  @apply text-sm sm:text-base md:text-lg lg:text-2xl;
}

.var-dump__header-date {
  @include mixins.text-muted;
  @apply text-sm font-semibold;
}

.var-dump__body {
  @apply py-5;
}

.var-dump__body-text {
  @include mixins.text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.var-dump__body-table {
  @apply mt-3;
}
</style>
