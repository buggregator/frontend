<script lang="ts" setup>
import moment from 'moment/moment';
import { computed } from 'vue';
import type { NormalizedEvent, OneOfValues } from '@/shared/types';
import { TableBase, TableBaseRow } from '@/shared/ui';
import { useRay } from '../../lib';
import { RayEventTypes, type RayDump } from '../../types';

type Props = {
  event: NormalizedEvent<RayDump>;
};

const { COMPONENT_TYPE_MAP } = useRay();

const props = defineProps<Props>();

const title = computed(() => {
  const type = String(props.event.payload.payloads[0].type || 'Unknown type');

  return type[0].toUpperCase() + type.slice(1);
});

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'));

const classes = computed(() => props.event?.meta
  ? [
    `text-${props.event.meta?.size}`,
    `text-${props.event.meta?.color}-500`,
  ]
  : []);

type GetComponents = (type: OneOfValues<RayEventTypes>) => OneOfValues<typeof COMPONENT_TYPE_MAP>;

const getComponent: GetComponents = (type) => COMPONENT_TYPE_MAP[type as RayEventTypes];

</script>

<template>
  <div
    ref="main"
    class="ray"
  >
    <main class="ray__in">
      <header class="ray__header">
        <h2 class="ray__header-title">
          {{ title }}
        </h2>
        <div class="ray__header-meta">
          <span class="ray__header-date">{{ date }}</span>
        </div>
      </header>

      <section class="ray__body">
        <template
          v-for="payload in event.payload.payloads"
          :key="`${payload.type}-${payload.origin ? payload.origin.line_number : ''}`"
        >
          <div v-if="payload.type && getComponent(payload.type)">
            <Component
              :is="getComponent(payload.type).view"
              v-bind="{ ...getComponent(payload.type).getProps(payload) }"
              :class="classes"
            />
          </div>
        </template>
      </section>

      <section class="ray__body">
        <h3 class="ray__body-text">
          Origin
        </h3>
        <TableBase class="ray__body-table">
          <TableBaseRow
            v-for="(value, name) in event.payload.payloads[0].origin"
            :key="name"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section class="ray__body">
        <h3 class="ray__body-text">
          Meta
        </h3>
        <TableBase class="ray__body-table">
          <TableBaseRow
            v-for="(value, name) in event.payload.meta"
            :key="name"
            :title="String(name)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import '../../../../assets/mixins';

.ray {
  @apply relative;
}

.ray__in {
  @apply flex flex-col h-full flex-grow py-5 px-3 md:px-4 lg:px-6;
}

.ray__header {
  @apply flex flex-col md:flex-row justify-between items-center;
}

.ray__header-meta {
  @apply flex flex-col md:flex-row items-center gap-x-5;
}

.ray__header-title {
  @apply text-sm sm:text-base md:text-lg lg:text-2xl;
}

.ray__header-date {
  @include text-muted;
  @apply text-sm font-semibold;
}

.ray__body {
  @apply py-5;
}

.ray__body-text {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.ray__body-table {
  @apply mt-3;
}
</style>
