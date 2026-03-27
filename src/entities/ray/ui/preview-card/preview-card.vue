<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent, OneOfValues } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { COMPONENT_TYPE_MAP } from '../../lib/use-ray/config'
import type { RayDump } from '../../types'
import { RayEventTypes } from '../../types'

type Props = {
  event: NormalizedEvent<RayDump>
}

const props = defineProps<Props>()

// Only apply color from meta, cap font size to text-sm max in preview cards
const classes = computed(() => {
  const color = props.event?.meta?.color
  return [color && color !== 'gray' ? `text-${color}-500` : ''].filter(Boolean)
})

const getComponent: (type: RayEventTypes | string) => OneOfValues<typeof COMPONENT_TYPE_MAP> = (
  type
) => COMPONENT_TYPE_MAP[type as RayEventTypes]
</script>

<template>
  <PreviewCard
    class="ray-preview"
    :event="props.event"
  >
    <div class="ray-preview__payloads">
      <template
        v-for="payload in event.payload.payloads"
        :key="`${payload.type}-${payload.origin ? payload.origin.line_number : ''}`"
      >
        <div
          v-if="payload.type && getComponent(payload.type)"
          class="ray-preview__payload"
        >
          <Component
            :is="getComponent(payload.type).view"
            v-bind="{ ...getComponent(payload.type).getProps(payload) }"
            :class="classes"
          />
        </div>
      </template>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.ray-preview__payloads {
  @apply flex flex-col gap-2 text-xs;
}

.ray-preview__payload {
  @apply min-w-0;
}
</style>
