<script lang="ts" setup>
import { computed } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import type { NormalizedEvent } from '@/shared/types'
import {
  TableBase,
  TableBaseRow,
  ValueDump,
  EventDetailLayout,
  EventDetailSection
} from '@/shared/ui'
import type { VarDump } from '../../types'

type Props = {
  event: NormalizedEvent<VarDump>
}

const props = defineProps<Props>()
const { buildLink } = useIdeLink()

const title = computed(() => {
  const type = String(props.event.payload.payload.type || 'Unknown type')
  return type[0].toUpperCase() + type.slice(1)
})

const source = computed(() => props.event.payload.context.source)
const sourceLink = computed(() =>
  source.value ? buildLink(source.value.file, source.value.line) : null
)
const request = computed(() => props.event.payload.context.request)
const cli = computed(() => props.event.payload.context.cli)
const label = computed(() => props.event.payload.payload.label)
</script>

<template>
  <EventDetailLayout
    :title="title"
    :date="event.date"
  >
    <!-- Source info boxes -->
    <EventDetailSection>
      <div class="vd-boxes">
        <div
          v-if="source"
          class="vd-box"
        >
          <span class="vd-box__label">File</span>
          <a
            v-if="sourceLink"
            :href="sourceLink"
            class="vd-box__value vd-box__value--link"
          >{{ source.file }}:{{ source.line }}</a>
          <span
            v-else
            class="vd-box__value"
          >{{ source.file }}:{{ source.line }}</span>
        </div>
        <div
          v-if="source?.name"
          class="vd-box"
        >
          <span class="vd-box__label">Name</span>
          <span class="vd-box__value">{{ source.name }}</span>
        </div>
        <div
          v-if="label"
          class="vd-box"
        >
          <span class="vd-box__label">Label</span>
          <span class="vd-box__value">{{ label }}</span>
        </div>
      </div>
    </EventDetailSection>

    <!-- Dump value -->
    <EventDetailSection title="Value">
      <div class="vd-value">
        <ValueDump
          :value="event.payload.payload.value"
          :type="event.payload.payload.type"
          :language="event.payload.payload.language || undefined"
        />
      </div>
    </EventDetailSection>

    <!-- Request context -->
    <EventDetailSection
      v-if="request"
      title="Request"
    >
      <div class="vd-boxes">
        <div
          v-if="request.method"
          class="vd-box"
        >
          <span class="vd-box__label">Method</span>
          <span class="vd-box__value vd-box__value--mono">{{ request.method }}</span>
        </div>
        <div
          v-if="request.uri"
          class="vd-box vd-box--wide"
        >
          <span class="vd-box__label">URI</span>
          <span class="vd-box__value vd-box__value--mono">{{ request.uri }}</span>
        </div>
        <div
          v-if="request.controller"
          class="vd-box vd-box--wide"
        >
          <span class="vd-box__label">Controller</span>
          <span class="vd-box__value vd-box__value--mono">{{ request.controller }}</span>
        </div>
        <div
          v-if="request.identifier"
          class="vd-box"
        >
          <span class="vd-box__label">Identifier</span>
          <span class="vd-box__value vd-box__value--mono">{{ request.identifier }}</span>
        </div>
      </div>
    </EventDetailSection>

    <!-- CLI context -->
    <EventDetailSection
      v-if="cli"
      title="CLI"
    >
      <TableBase>
        <TableBaseRow
          v-if="cli.command_line"
          title="Command"
        >
          {{ cli.command_line }}
        </TableBaseRow>
        <TableBaseRow
          v-if="cli.identifier"
          title="Identifier"
        >
          {{ cli.identifier }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.vd-boxes {
  @apply flex flex-col sm:flex-row flex-wrap gap-2;
}

.vd-box {
  @apply flex flex-col flex-1 p-3 rounded min-w-0;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.vd-box--wide {
  @apply sm:flex-[2];
}

.vd-box__label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.vd-box__value {
  @apply text-xs mt-1 break-all;
}

.vd-box__value--mono {
  @apply font-mono;
}

.vd-box__value--link {
  @apply text-blue-600 dark:text-blue-400 hover:underline cursor-pointer;
}

.vd-value {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}
</style>
