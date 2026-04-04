<script lang="ts" setup>
import { ref, toRef } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { TableBase, TableBaseRow, EventDetailSection } from '@/shared/ui'
import { useHttpDumpEvent } from '../../lib'
import type { HttpDump } from '../../types'
import { HttpBodyView } from '../http-body-view'
import HttpBodyViewToggle from '../http-body-view/http-body-view-toggle.vue'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const {
  response,
  responseContentType,
  responseBodyLanguage,
  isBinaryResponse,
  responseBodySize,
  hasResponseHeaders,
  statusCode,
  durationMs,
  statusColor
} = useHttpDumpEvent(toRef(props, 'event'))

const bodyViewRef = ref<InstanceType<typeof HttpBodyView> | null>(null)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Status sub-header -->
    <div class="http-response-status">
      <span
        v-if="statusCode"
        class="http-response-status__badge"
        :class="statusColor"
      >{{
        statusCode
      }}</span>
      <span
        v-if="responseContentType"
        class="http-tag"
      >{{ responseContentType }}</span>
      <span
        v-if="responseBodySize"
        class="http-tag"
      >{{ responseBodySize }}</span>
      <span
        v-if="durationMs != null"
        class="http-tag"
      >{{ durationMs }}ms</span>
    </div>

    <!-- Response Body -->
    <EventDetailSection
      v-if="response?.body && !isBinaryResponse"
      title="Response Body"
    >
      <template #actions>
        <HttpBodyViewToggle
          v-if="bodyViewRef?.isJson"
          :modes="['raw', 'pretty', 'tree']"
          :active="bodyViewRef.viewMode"
          @update:active="bodyViewRef.viewMode = $event"
        />
        <HttpBodyViewToggle
          v-if="bodyViewRef?.isHtml"
          :modes="['preview', 'source']"
          :active="bodyViewRef.htmlMode"
          @update:active="bodyViewRef.htmlMode = $event"
        />
      </template>

      <HttpBodyView
        ref="bodyViewRef"
        :body="response!.body"
        :language="responseBodyLanguage"
      />
    </EventDetailSection>

    <EventDetailSection
      v-if="isBinaryResponse"
      title="Response Body"
    >
      <div class="http-response-binary">
        <span class="http-tag">{{ responseContentType }}</span>
        <span class="http-tag">{{ responseBodySize }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">Binary content — not displayed</span>
      </div>
    </EventDetailSection>

    <!-- Response Headers -->
    <EventDetailSection
      v-if="hasResponseHeaders"
      title="Response Headers"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in response!.headers"
          :key="key"
          :title="String(key)"
          :copy-value="Array.isArray(value) ? value[0] : String(value)"
        >
          {{ Array.isArray(value) ? value[0] : value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>
  </div>
</template>

<style lang="scss" scoped>
.http-response-status {
  @apply flex items-center gap-2;
}

.http-response-status__badge {
  @apply font-bold text-sm px-2 py-0.5 rounded uppercase tracking-wide;
}

.http-tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.http-response-binary {
  @apply flex items-center gap-3 py-3;
}
</style>
