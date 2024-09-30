<script lang="ts" setup>
import { computed } from 'vue';
import type { NormalizedEvent, OneOfValues } from '@/shared/types';
import { PreviewCard } from '@/shared/ui';
import { COMPONENT_TYPE_MAP } from '../../lib/use-ray/config';
import type { RayDump } from '../../types';
import { RayEventTypes } from '../../types';

type Props = {
  event: NormalizedEvent<RayDump>;
};

const props = defineProps<Props>();

const classes = computed(
  () => [
    `text-${props.event?.meta?.size || 'sm'}`,
    `text-${props.event?.meta?.color || 'gray'}-500`,
    '',
  ],
);

type GetComponent = (
  type: RayEventTypes | string
) => OneOfValues<typeof COMPONENT_TYPE_MAP>;

const getComponent: GetComponent = (type) =>
  COMPONENT_TYPE_MAP[type as RayEventTypes];

const calcPayloadKey = (type: string, line: string = '') => `${type}-${line}`;

</script>

<template>
  <PreviewCard
    class="ray-dump-preview"
    :event="props.event"
  >
    <template
      v-for="payload in event.payload.payloads"
      :key="calcPayloadKey(payload.type, payload.origin.line_number)"
    >
      <div v-if="payload.type && getComponent(payload.type)">
        <Component
          :is="getComponent(payload.type).view"
          v-bind="{ ...getComponent(payload.type).getProps(payload) }"
          :class="classes"
        />
      </div>
    </template>
  </PreviewCard>
</template>
