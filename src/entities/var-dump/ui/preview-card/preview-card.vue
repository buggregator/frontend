<script lang="ts" setup>
import { computed } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard, ValueDump } from '@/shared/ui'
import type { VarDump } from '../../types'

type Props = {
  event: NormalizedEvent<VarDump>
}

const props = defineProps<Props>()
const { buildLink } = useIdeLink()

const eventValue = computed(() => String(props.event.payload?.payload?.value || ''))
const eventType = computed(() => String(props.event.payload?.payload?.type || 'string'))
const eventLanguage = computed(() => String(props.event.payload?.payload?.language || 'plaintext'))

const sourceObj = computed(() => props.event.payload?.context?.source)
const source = computed(() => {
  if (!sourceObj.value?.file) return null
  return `${sourceObj.value.file}:${sourceObj.value.line}`
})
const sourceLink = computed(() =>
  sourceObj.value ? buildLink(sourceObj.value.file, sourceObj.value.line) : null
)

const typeName = computed(() => {
  const t = props.event.payload?.payload?.type
  if (!t || t === 'string') return null
  return t
})
</script>

<template>
  <PreviewCard :event="event">
    <div class="vd-body">
      <div
        v-if="source || typeName"
        class="vd-body__meta"
      >
        <span
          v-if="typeName"
          class="vd-body__type"
        >{{ typeName }}</span>
        <a
          v-if="source && sourceLink"
          :href="sourceLink"
          class="vd-body__source vd-body__source--link"
          @click.stop
        >{{ source }}</a>
        <span
          v-else-if="source"
          class="vd-body__source"
        >{{ source }}</span>
      </div>

      <div class="vd-body__value">
        <ValueDump
          :value="eventValue"
          :type="eventType"
          :language="eventLanguage"
        />
      </div>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.vd-body {
  @apply block rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.vd-body__meta {
  @apply flex items-center gap-2 px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs;
}

.vd-body__type {
  @apply font-medium text-gray-600 dark:text-gray-300;
}

.vd-body__source {
  @apply font-mono text-gray-400 dark:text-gray-500;
}

.vd-body__source--link {
  @apply text-blue-500 dark:text-blue-400 hover:underline cursor-pointer;
}

.vd-body__value {
  @apply text-xs;

  :deep(.value-dump__html) {
    @apply rounded-none border-0;
  }

  :deep(.code-snippet) {
    @apply rounded-none;
  }
}
</style>
