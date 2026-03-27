<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent, OneOfValues } from '@/shared/types'
import { TableBase, TableBaseRow, EventDetailLayout, EventDetailSection } from '@/shared/ui'
import { useRay } from '../../lib'
import { RayEventTypes, type RayDump } from '../../types'

type Props = {
  event: NormalizedEvent<RayDump>
}

const { COMPONENT_TYPE_MAP } = useRay()

const props = defineProps<Props>()

const title = computed(() => {
  const type = String(props.event.payload.payloads[0].type || 'Unknown type')
  return type[0].toUpperCase() + type.slice(1)
})

const classes = computed(() => {
  if (!props.event?.meta) return []
  const color = props.event.meta.color
  return [color && color !== 'gray' ? `text-${color}-500` : ''].filter(Boolean)
})

const getComponent: (type: RayEventTypes | string) => OneOfValues<typeof COMPONENT_TYPE_MAP> = (
  type
) => COMPONENT_TYPE_MAP[type as RayEventTypes]
</script>

<template>
  <EventDetailLayout
    :title="title"
    :date="event.date"
  >
    <EventDetailSection>
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
    </EventDetailSection>

    <EventDetailSection title="Origin">
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in event.payload.payloads[0].origin"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <EventDetailSection title="Meta">
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in event.payload.meta"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>
  </EventDetailLayout>
</template>
