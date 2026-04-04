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

const isProxy = computed(() => !!props.event.payload.proxy)

const uri = computed(() => {
  const rawUri = decodeURI(props.event.payload?.request?.uri)
  if (isProxy.value) {
    return `${props.event.payload.host}${rawUri}`
  }
  return rawUri
})

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

// Response
const response = computed(() => props.event.payload.response)
const hasResponse = computed(() => !!response.value)
const statusCode = computed(() => response.value?.status_code)
const durationMs = computed(() => props.event.payload.duration_ms)
const proxyError = computed(() => props.event.payload.error)

const statusColor = computed(() => {
  const code = statusCode.value
  if (!code) return ''
  if (code >= 500) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
  if (code >= 400) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
  if (code >= 300) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
  return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
})

const hasResponseHeaders = computed(() => Object.keys(response.value?.headers || {}).length > 0)

const responseContentType = computed(() => {
  if (!response.value?.headers) return null
  const ct = response.value.headers['content-type'] || response.value.headers['Content-Type']
  if (!ct) return null
  const val = Array.isArray(ct) ? ct[0] : ct
  return val?.split(';')[0]?.trim() || null
})

const responseBodyLanguage = computed(() => {
  const ct = responseContentType.value
  if (!ct) return 'plaintext'
  if (ct.includes('json')) return 'json'
  if (ct.includes('xml') || ct.includes('svg')) return 'xml'
  if (ct.includes('html')) return 'html'
  if (ct.includes('css')) return 'css'
  if (ct.includes('javascript')) return 'javascript'
  return 'plaintext'
})

const responseBody = computed(() => {
  const body = response.value?.body
  if (!body) return null
  // Try to pretty-print JSON
  if (responseBodyLanguage.value === 'json') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return body
})

const isBinaryResponse = computed(() => {
  const ct = responseContentType.value
  if (!ct) return false
  return (
    ct.startsWith('image/') ||
    ct.startsWith('audio/') ||
    ct.startsWith('video/') ||
    ct.includes('octet-stream') ||
    ct.includes('zip') ||
    ct.includes('gzip') ||
    ct.includes('tar') ||
    ct.includes('pdf')
  )
})

const responseBodySize = computed(() => {
  const len = response.value?.body?.length || 0
  if (!len) return null
  if (len < 1024) return `${len} B`
  if (len < 1024 * 1024) return `${(len / 1024).toFixed(1)} KB`
  return `${(len / (1024 * 1024)).toFixed(1)} MB`
})

const curlCommand = computed(() => {
  const req = props.event.payload.request
  let curl = `curl -X ${req.method}`

  if (isProxy.value) {
    curl += ` '${props.event.payload.host}${req.uri}'`
  } else if (host.value) {
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
            <span
              v-if="statusCode"
              class="http-header__method"
              :class="statusColor"
            >{{
              statusCode
            }}</span>
            <span class="http-header__uri">{{ uri }}</span>
          </div>
        </div>

        <div class="http-header__meta">
          <span
            v-if="isProxy"
            class="http-header__tag http-header__tag--proxy"
          >proxy</span>
          <span
            v-if="durationMs != null"
            class="http-header__tag"
          >{{ durationMs }}ms</span>
          <span
            v-if="!isProxy && host"
            class="http-header__tag"
          >{{ host }}</span>
          <span
            v-if="contentType"
            class="http-header__tag"
          >{{ contentType }}</span>
        </div>

        <div
          v-if="proxyError"
          class="http-header__error"
        >
          {{ proxyError }}
        </div>
      </div>
    </template>

    <!-- Response section (proxy events) -->
    <template v-if="hasResponse">
      <EventDetailSection
        v-if="hasResponseHeaders"
        title="Response Headers"
      >
        <TableBase>
          <TableBaseRow
            v-for="(value, key) in response!.headers"
            :key="key"
            :title="String(key)"
          >
            {{ Array.isArray(value) ? value[0] : value }}
          </TableBaseRow>
        </TableBase>
      </EventDetailSection>

      <EventDetailSection
        v-if="responseBody && !isBinaryResponse"
        title="Response Body"
      >
        <div class="http-response-meta">
          <span
            v-if="responseContentType"
            class="http-header__tag"
          >{{ responseContentType }}</span>
          <span
            v-if="responseBodySize"
            class="http-header__tag"
          >{{ responseBodySize }}</span>
        </div>

        <!-- HTML preview -->
        <div
          v-if="responseBodyLanguage === 'html'"
          class="http-response-preview"
        >
          <iframe
            :srcdoc="response!.body"
            sandbox=""
            class="http-response-preview__iframe"
          />
        </div>

        <CodeSnippet
          :language="responseBodyLanguage"
          :code="responseBody"
        />
      </EventDetailSection>

      <EventDetailSection
        v-if="isBinaryResponse"
        title="Response Body"
      >
        <div class="http-response-binary">
          <span class="http-header__tag">{{ responseContentType }}</span>
          <span class="http-header__tag">{{ responseBodySize }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">Binary content — not displayed</span>
        </div>
      </EventDetailSection>
    </template>

    <!-- Request sections -->
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
      title="Request Headers"
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

    <!-- Raw formats -->
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

.http-header__tag--proxy {
  @apply bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400;
}

.http-header__error {
  @apply text-xs font-mono text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded;
}

/* Response preview */
.http-response-meta {
  @apply flex items-center gap-2 mb-3;
}

.http-response-preview {
  @apply mb-3 border border-gray-200 dark:border-gray-700 rounded overflow-hidden;
}

.http-response-preview__iframe {
  @apply w-full bg-white;
  height: 300px;
  border: none;
}

.http-response-binary {
  @apply flex items-center gap-3 py-3;
}

/* Raw formats section — visually separated */
.http-raw {
  @apply flex flex-col gap-6 pt-4 mt-2;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
