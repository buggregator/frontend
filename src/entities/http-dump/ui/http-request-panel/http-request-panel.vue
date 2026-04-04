<script lang="ts" setup>
import { computed, ref, toRef } from 'vue'
import { useAttachments } from '@/shared/lib/io'
import type { NormalizedEvent, Attachment } from '@/shared/types'
import { TableBase, TableBaseRow, FileAttachment, EventDetailSection } from '@/shared/ui'
import { useHttpDumpEvent } from '../../lib'
import type { HttpDump } from '../../types'
import { HttpBodyView } from '../http-body-view'
import HttpBodyViewToggle from '../http-body-view/http-body-view-toggle.vue'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const { calcDownloadLink } = useAttachments('http-dump')
const calcDownloadUrl = (attachmentId: Attachment['uuid']) =>
  calcDownloadLink(props.event.id, attachmentId)

const bodyViewRef = ref<InstanceType<typeof HttpBodyView> | null>(null)

const {
  contentType,
  hasBody,
  bodySize,
  hasQuery,
  hasPostData,
  hasHeaders,
  hasCookies,
  hasAttachments
} = useHttpDumpEvent(toRef(props, 'event'))

const requestBodyLanguage = computed(() => {
  const ct = contentType.value
  if (!ct) return 'plaintext'
  if (ct.includes('json')) return 'json'
  if (ct.includes('xml')) return 'xml'
  if (ct.includes('html')) return 'html'
  return 'plaintext'
})

const isFormUrlEncoded = computed(
  () => contentType.value?.includes('x-www-form-urlencoded') ?? false
)

const formParams = computed(() => {
  if (!isFormUrlEncoded.value || !props.event.payload.request.body) return {}
  const params: Record<string, string> = {}
  for (const pair of props.event.payload.request.body.split('&')) {
    const [key, ...rest] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='))
    }
  }
  return params
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Request Body (NEW — first section) -->
    <EventDetailSection
      v-if="hasBody"
      title="Request Body"
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

      <!-- Form URL-encoded: render as table -->
      <template v-if="isFormUrlEncoded">
        <div class="flex items-center gap-2 mb-3">
          <span
            v-if="contentType"
            class="http-tag"
          >{{ contentType }}</span>
          <span
            v-if="bodySize"
            class="http-tag"
          >{{ bodySize }}</span>
        </div>
        <TableBase>
          <TableBaseRow
            v-for="(value, key) in formParams"
            :key="key"
            :title="String(key)"
            :copy-value="String(value)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </template>

      <!-- Other bodies: HttpBodyView with Raw/Pretty/Tree toggle -->
      <HttpBodyView
        v-else
        ref="bodyViewRef"
        :body="event.payload.request.body"
        :language="requestBodyLanguage"
        :content-type="contentType || undefined"
        :size="bodySize || undefined"
      />
    </EventDetailSection>

    <!-- Query Parameters -->
    <EventDetailSection
      v-if="hasQuery"
      title="Query Parameters"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.query"
          :key="key"
          :title="String(key)"
          :copy-value="String(value)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- POST Data -->
    <EventDetailSection
      v-if="hasPostData"
      title="POST Data"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.post"
          :key="key"
          :title="String(key)"
          :copy-value="String(value)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- Request Headers -->
    <EventDetailSection
      v-if="hasHeaders"
      title="Request Headers"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.headers"
          :key="key"
          :title="String(key)"
          :copy-value="Array.isArray(value) ? value[0] : String(value)"
        >
          {{ Array.isArray(value) ? value[0] : value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- Cookies -->
    <EventDetailSection
      v-if="hasCookies"
      title="Cookies"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.cookies"
          :key="key"
          :title="String(key)"
          :copy-value="String(value)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- Attachments -->
    <EventDetailSection
      v-if="hasAttachments"
      title="Attachments"
      :count="event.payload.request.files?.length || 0"
    >
      <div class="flex gap-x-3">
        <FileAttachment
          v-for="file in event.payload.request.files"
          :key="file.uuid"
          :event-id="event.id"
          :attachment="file"
          :download-url="calcDownloadUrl(file.uuid)"
        />
      </div>
    </EventDetailSection>
  </div>
</template>

<style lang="scss" scoped>
.http-tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}
</style>
