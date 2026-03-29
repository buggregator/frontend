<script lang="ts" setup>
import { computed } from 'vue'
import { useAttachments } from '@/shared/lib/io'
import type { NormalizedEvent, Attachment } from '@/shared/types'
import {
  TableBase,
  TableBaseRow,
  FileAttachment,
  CodeSnippet,
  EventDetailLayout,
  EventDetailSection
} from '@/shared/ui'
import type { HttpDump } from '../../types'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const { calcDownloadLink } = useAttachments('http-dump')

const calcDownloadUrl = (attachmentId: Attachment['uuid']) =>
  calcDownloadLink(props.event.id, attachmentId)

const uri = computed(() => decodeURI(props.event.payload?.request?.uri))

const hasPostData = computed(
  () =>
    props.event.payload?.request?.post && Object.keys(props.event.payload?.request?.post).length > 0
)

const hasQuery = computed(
  () =>
    props.event.payload?.request?.query &&
    Object.keys(props.event.payload?.request?.query).length > 0
)

const hasHeaders = computed(
  () => Object.keys(props.event.payload?.request?.headers || {}).length > 0
)

const hasCookies = computed(
  () =>
    props.event.payload?.request?.cookies &&
    Object.keys(props.event.payload?.request?.cookies).length > 0
)

const hasAttachments = computed(
  () =>
    props.event.payload?.request?.files &&
    Object.keys(props.event.payload?.request?.files).length > 0
)

const method = computed(() => props.event.payload.request.method)

const methodColor = computed(() => {
  const m = method.value?.toUpperCase()
  if (m === 'GET') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
  if (m === 'POST') return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
  if (m === 'PUT' || m === 'PATCH')
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
  if (m === 'DELETE') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10'
})

const host = computed(() => {
  const h = props.event.payload.request.headers?.host
  if (!h) return null
  return Array.isArray(h) ? h[0] : h
})

const contentType = computed(() => {
  const ct =
    props.event.payload.request.headers?.['content-type'] ||
    props.event.payload.request.headers?.['Content-Type']
  if (!ct) return null
  const val = Array.isArray(ct) ? ct[0] : ct
  return val?.split(';')[0]?.trim() || null
})

const curlCommand = computed(() => {
  const req = props.event.payload.request
  let curl = `curl -X ${req.method}`

  if (host.value) {
    curl += ` '${host.value}${req.uri}'`
  } else {
    curl += ` '${req.uri}'`
  }

  const headers = req.headers || {}
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === 'host') continue
    const v = Array.isArray(val) ? val[0] : val
    curl += ` \\\n  -H '${key}: ${v}'`
  }

  if (req.body) {
    curl += ` \\\n  -d '${req.body.replace(/'/g, "'\\''")}'`
  }

  return curl
})

const rawHttp = computed(() => {
  const req = props.event.payload.request
  let raw = `${req.method} ${req.uri} HTTP/1.1\n`

  const headers = req.headers || {}
  for (const [key, val] of Object.entries(headers)) {
    const v = Array.isArray(val) ? val[0] : val
    raw += `${key}: ${v}\n`
  }

  if (req.body) {
    raw += `\n${req.body}`
  }

  return raw
})
</script>

<template>
  <EventDetailLayout :date="event.date">
    <template #header>
      <div class="http-header">
        <div class="http-header__top">
          <div class="http-header__row">
            <span
              class="http-header__method"
              :class="methodColor"
            >{{ method }}</span>
            <span class="http-header__uri">{{ uri }}</span>
          </div>
        </div>

        <div class="http-header__meta">
          <span
            v-if="host"
            class="http-header__tag"
          >{{ host }}</span>
          <span
            v-if="contentType"
            class="http-header__tag"
          >{{ contentType }}</span>
        </div>
      </div>
    </template>

    <!-- 1. Structured request data -->
    <EventDetailSection
      v-if="hasQuery"
      title="Query Parameters"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.query"
          :key="key"
          :title="String(key)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <EventDetailSection
      v-if="hasPostData"
      title="POST Data"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.post"
          :key="key"
          :title="String(key)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <EventDetailSection
      v-if="hasHeaders"
      title="Headers"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.headers"
          :key="key"
          :title="String(key)"
        >
          {{ value[0] || value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <EventDetailSection
      v-if="hasCookies"
      title="Cookies"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, key) in event.payload.request.cookies"
          :key="key"
          :title="String(key)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

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

    <!-- 2. Raw formats -->
    <div class="http-raw">
      <EventDetailSection title="cURL">
        <CodeSnippet
          language="bash"
          :code="curlCommand"
        />
      </EventDetailSection>

      <EventDetailSection title="Raw HTTP">
        <CodeSnippet
          language="plaintext"
          :code="rawHttp"
        />
      </EventDetailSection>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.http-header {
  @apply flex flex-col gap-2;
}

.http-header__top {
  @apply flex items-center justify-between gap-3;
}

.http-header__row {
  @apply flex items-baseline gap-3 font-mono;
}

.http-header__method {
  @apply font-bold text-sm px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0;
}

.http-header__uri {
  @apply text-sm text-gray-700 dark:text-gray-200 break-all;
}

.http-header__meta {
  @apply flex items-center gap-2;
}

.http-header__tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

/* Raw formats section — visually separated */
.http-raw {
  @apply flex flex-col gap-6 pt-4 mt-2;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
