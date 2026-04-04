<script lang="ts" setup>
import { computed, ref, toRef } from 'vue'
import { CodeSnippet } from '@/shared/ui'
import { JsonTreeView, useJsonTree } from '@/shared/ui/json-tree-view'

type Props = {
  body: string | null
  language: string
  contentType?: string
  size?: string
}

const props = defineProps<Props>()

const { parsed, isJson } = useJsonTree(toRef(props, 'body'))

type ViewMode = 'raw' | 'pretty' | 'tree'
type HtmlMode = 'preview' | 'source'

const viewMode = ref<ViewMode>(isJson.value ? 'tree' : 'pretty')
const htmlMode = ref<HtmlMode>('preview')

const prettyJson = computed(() => {
  if (!props.body || !isJson.value) return props.body
  try {
    return JSON.stringify(JSON.parse(props.body), null, 2)
  } catch {
    return props.body
  }
})

const isHtml = computed(() => props.language === 'html')

const openHtmlPreview = () => {
  if (!props.body) return
  const win = window.open('about:blank')
  if (win) {
    win.document.write(props.body)
    win.document.close()
  }
}

defineExpose({ viewMode, htmlMode, isJson, isHtml })
</script>

<template>
  <div class="http-body-view">
    <!-- Header with meta + toggle (shown when no external #toggle slot) -->
    <div
      v-if="contentType || size"
      class="http-body-view__header"
    >
      <div class="http-body-view__meta">
        <span
          v-if="contentType"
          class="http-body-view__tag"
        >{{ contentType }}</span>
        <span
          v-if="size"
          class="http-body-view__tag"
        >{{ size }}</span>
      </div>
    </div>

    <!-- HTML -->
    <template v-if="isHtml && body">
      <div
        v-if="htmlMode === 'preview'"
        class="http-body-view__html-preview"
      >
        <iframe
          :srcdoc="body"
          sandbox=""
          class="http-body-view__iframe"
        />
        <button
          class="http-body-view__open-tab"
          @click="openHtmlPreview"
        >
          Open in new tab
        </button>
      </div>

      <CodeSnippet
        v-if="htmlMode === 'source'"
        language="html"
        :code="body"
      />
    </template>

    <!-- JSON Tree mode -->
    <JsonTreeView
      v-else-if="isJson && viewMode === 'tree' && parsed"
      :value="parsed"
    />

    <!-- JSON Pretty mode -->
    <CodeSnippet
      v-else-if="isJson && viewMode === 'pretty'"
      language="json"
      :code="prettyJson"
    />

    <!-- JSON Raw mode or non-JSON fallback -->
    <CodeSnippet
      v-else
      :language="language"
      :code="body"
    />
  </div>
</template>

<style lang="scss" scoped>
.http-body-view__header {
  @apply flex items-center justify-between gap-2 mb-3;
}

.http-body-view__meta {
  @apply flex items-center gap-2;
}

.http-body-view__tag {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.http-body-view__html-preview {
  @apply border border-gray-200 dark:border-gray-700 rounded overflow-hidden relative;
}

.http-body-view__iframe {
  @apply w-full bg-white;
  max-height: 400px;
  border: none;
}

.http-body-view__open-tab {
  @apply absolute top-2 right-2 px-2 py-1 rounded;
  @apply text-2xs font-medium cursor-pointer;
  @apply bg-gray-100/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700;
  @apply transition-colors duration-150;
}
</style>
