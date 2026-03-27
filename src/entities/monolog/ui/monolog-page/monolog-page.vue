<script lang="ts" setup>
import type { NormalizedEvent } from '@/shared/types'
import {
  CodeSnippet,
  TableBase,
  TableBaseRow,
  EventDetailLayout,
  EventDetailSection
} from '@/shared/ui'
import type { Monolog } from '../../types'

type Props = {
  event: NormalizedEvent<Monolog>
}

defineProps<Props>()
</script>

<template>
  <EventDetailLayout
    :title="`Channel: ${event.payload.channel}`"
    :date="event.date"
  >
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
