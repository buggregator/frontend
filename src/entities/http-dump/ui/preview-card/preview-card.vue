<script lang="ts" setup>
import { computed, ref } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard, IconSvg } from '@/shared/ui'
import type { HttpDump } from '../../types'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const isProxy = computed(() => !!props.event.payload.proxy)
const eventLink = computed(() => `/http-dump/${props.event.id}`)
const method = computed(() => props.event.payload.request.method)

const uri = computed(() => {
  const rawUri = decodeURI(props.event.payload.request.uri)
  if (isProxy.value) {
    const host = props.event.payload.host
    return `${host}${rawUri}`
  }
  return rawUri
})

const statusCode = computed(() => props.event.payload.response?.status_code)
const statusColor = computed(() => {
  const code = statusCode.value
  if (!code) return ''
  if (code >= 500) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
  if (code >= 400) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
  if (code >= 300) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
  return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
})

const durationMs = computed(() => props.event.payload.duration_ms)

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

const queryCount = computed(() => Object.keys(props.event.payload.request.query || {}).length)
const headerCount = computed(() => Object.keys(props.event.payload.request.headers || {}).length)
const hasBody = computed(() => (props.event.payload.request.body?.length || 0) > 0)

const bodySize = computed(() => {
  const len = props.event.payload.request.body?.length || 0
  if (!len) return null
  if (len < 1024) return `${len} B`
  return `${(len / 1024).toFixed(1)} KB`
})

const isCopied = ref(false)

const buildCurl = (): string => {
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
}

const copyCurl = () => {
  isCopied.value = true
  copyTextToClipboard(buildCurl()).catch(console.error)
  setTimeout(() => {
    isCopied.value = false
  }, 1500)
}
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="http-body"
    >
      <!-- Copy cURL button (top-right, hover reveal) -->
      <button
        class="http-body__copy"
        :class="{ 'http-body__copy--active': isCopied }"
        title="Copy as cURL"
        aria-label="Copy as cURL"
        @click.stop.prevent="copyCurl"
      >
        <IconSvg
          name="copy"
          class="http-body__copy-icon"
        />
        <span class="http-body__copy-text">{{ isCopied ? 'Copied' : 'cURL' }}</span>
      </button>

      <div class="http-body__row">
        <span
          class="http-body__method"
          :class="methodColor"
        >{{ method }}</span>
        <span
          v-if="statusCode"
          class="http-body__method"
          :class="statusColor"
        >{{
          statusCode
        }}</span>
        <span class="http-body__uri">{{ uri }}</span>
      </div>

      <div class="http-body__meta">
        <span
          v-if="isProxy"
          class="http-body__tag http-body__tag--proxy"
        >proxy</span>

        <span
          v-if="durationMs != null"
          class="http-body__tag"
        >{{ durationMs }}ms</span>

        <span
          v-if="!isProxy && host"
          class="http-body__tag"
        >{{ host }}</span>

        <span
          v-if="contentType"
          class="http-body__tag"
        >{{ contentType }}</span>

        <span
          v-if="queryCount > 0"
          class="http-body__tag"
        >{{ queryCount }} param{{ queryCount > 1 ? 's' : '' }}</span>

        <span
          v-if="hasBody && bodySize"
          class="http-body__tag"
        >body {{ bodySize }}</span>

        <span class="http-body__tag">{{ headerCount }} header{{ headerCount > 1 ? 's' : '' }}</span>
      </div>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.http-body {
  @apply relative block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.http-body__copy {
  @apply opacity-0 absolute top-2 right-2;
  @apply flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-all duration-150 cursor-pointer z-10;

  .http-body:hover & {
    @apply opacity-100;
  }
}

.http-body__copy--active {
  @apply opacity-100 text-green-600 dark:text-green-400;
}

.http-body__copy-icon {
  @apply w-3 h-3;
}

.http-body__copy-text {
  @apply hidden sm:inline;
}

.http-body__row {
  @apply flex items-baseline gap-2 font-mono text-xs mb-2;
}

.http-body__method {
  @apply font-bold text-2xs px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0;
}

.http-body__uri {
  @apply text-gray-700 dark:text-gray-200 break-all;
}

.http-body__meta {
  @apply flex flex-wrap gap-1;
}

.http-body__tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.http-body__tag--proxy {
  @apply bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400;
}
</style>
