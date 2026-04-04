<script lang="ts" setup>
import { ref, toRef } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import type { NormalizedEvent } from '@/shared/types'
import { IconSvg } from '@/shared/ui'
import { useHttpDumpEvent } from '../../lib'
import type { HttpDump } from '../../types'

type Props = {
  event: NormalizedEvent<HttpDump>
}

const props = defineProps<Props>()

const {
  isProxy,
  method,
  uri,
  contentType,
  statusCode,
  durationMs,
  proxyError,
  methodColor,
  statusColor,
  curlCommand
} = useHttpDumpEvent(toRef(props, 'event'))

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
}

const statusText = (code: number) => STATUS_TEXT[code] || ''

const isCurlCopied = ref(false)
const isUrlCopied = ref(false)

const copyCurl = () => {
  isCurlCopied.value = true
  copyTextToClipboard(curlCommand.value).catch(console.error)
  setTimeout(() => {
    isCurlCopied.value = false
  }, 1500)
}

const copyUrl = () => {
  isUrlCopied.value = true
  copyTextToClipboard(uri.value).catch(console.error)
  setTimeout(() => {
    isUrlCopied.value = false
  }, 1500)
}
</script>

<template>
  <div class="http-dump-header">
    <div class="http-dump-header__main">
      <div class="http-dump-header__row">
        <span
          class="http-dump-header__badge"
          :class="methodColor"
        >{{ method }}</span>

        <template v-if="statusCode">
          <span
            class="http-dump-header__badge"
            :class="statusColor"
          >{{ statusCode }} {{ statusText(statusCode) }}</span>
        </template>

        <span class="http-dump-header__uri">{{ uri }}</span>
      </div>

      <div class="http-dump-header__actions">
        <button
          class="http-dump-header__action"
          :title="isCurlCopied ? 'Copied!' : 'Copy cURL'"
          @click="copyCurl"
        >
          <IconSvg
            name="copy"
            class="w-3.5 h-3.5"
          />
          <span>{{ isCurlCopied ? 'Copied' : 'cURL' }}</span>
        </button>

        <button
          class="http-dump-header__action"
          :title="isUrlCopied ? 'Copied!' : 'Copy URL'"
          @click="copyUrl"
        >
          <IconSvg
            name="copy"
            class="w-3.5 h-3.5"
          />
          <span>{{ isUrlCopied ? 'Copied' : 'URL' }}</span>
        </button>
      </div>
    </div>

    <div class="http-dump-header__meta">
      <span
        v-if="isProxy"
        class="http-dump-header__tag http-dump-header__tag--proxy"
      >proxy</span>
      <span
        v-if="durationMs != null"
        class="http-dump-header__tag"
      >{{ durationMs }}ms</span>
      <span
        v-if="contentType"
        class="http-dump-header__tag"
      >{{ contentType }}</span>
    </div>

    <div
      v-if="proxyError"
      class="http-dump-header__error"
    >
      {{ proxyError }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.http-dump-header {
  @apply flex flex-col gap-2;
  position: sticky;
  top: 0;
  z-index: 10;
  @apply bg-white dark:bg-gray-900;
  @apply pb-3 -mb-1;
}

.http-dump-header__main {
  @apply flex items-start justify-between gap-3;
}

.http-dump-header__row {
  @apply flex items-baseline gap-2 font-mono text-sm flex-1 min-w-0;
}

.http-dump-header__badge {
  @apply font-bold text-xs px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0;
}

.http-dump-header__uri {
  @apply text-gray-700 dark:text-gray-200 break-all;
}

.http-dump-header__actions {
  @apply flex items-center gap-1 flex-shrink-0;
}

.http-dump-header__action {
  @apply flex items-center gap-1 px-2 py-1 rounded;
  @apply text-2xs font-medium cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-colors duration-150;
}

.http-dump-header__meta {
  @apply flex items-center gap-2;
}

.http-dump-header__tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.http-dump-header__tag--proxy {
  @apply bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400;
}

.http-dump-header__error {
  @apply text-xs font-mono text-red-700 dark:text-red-300;
  @apply bg-red-50 dark:bg-red-900/20;
  @apply border-l-4 border-red-500;
  @apply px-4 py-2 rounded-r;
}
</style>
