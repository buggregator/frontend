<script lang="ts" setup>
import { computed } from "vue";
import type { NormalizedEvent, OneOfValues } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import { COMPONENT_TYPE_MAP } from "../../lib/use-ray/config";
import type { RayDump } from "../../types";
import { RAY_EVENT_TYPES } from "../../types";

type Props = {
  event: NormalizedEvent<RayDump>;
};

const props = defineProps<Props>();

const classes = computed(() => [
  `text-${props.event?.meta?.size || "sm"}`,
  `text-${props.event?.meta?.color || "gray"}-500`,
]);

const getComponent: (
  type: RAY_EVENT_TYPES | string,
) => OneOfValues<typeof COMPONENT_TYPE_MAP> = (type) =>
  COMPONENT_TYPE_MAP[type as RAY_EVENT_TYPES];
</script>

<template>
  <PreviewCard class="ray-dump-preview" :event="props.event">
    <template
      v-for="payload in event.payload.payloads"
      :key="`${payload.type}-${
        payload.origin ? payload.origin.line_number : ''
      }`"
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
