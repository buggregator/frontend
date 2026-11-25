<script lang="ts" setup>
import { computed } from 'vue'
import { renderMarkdown, splitFences } from '../../lib/markdown'
import { CodeSnippet } from '../code-snippet'

// Markdown from outside (an agent's answer): prose rendered by markdown-it
// with raw HTML off, fenced code shown by CodeSnippet (highlighted, escaped,
// scrolls sideways inside its own box).
type Props = { text: string }

const props = defineProps<Props>()

const parts = computed(() =>
  splitFences(props.text).map((p) =>
    p.kind === 'prose' ? { ...p, html: renderMarkdown(p.text) } : p
  )
)
</script>

<template>
  <div class="md-text">
    <template
      v-for="(p, i) in parts"
      :key="i"
    >
      <!-- eslint-disable vue/no-v-html -- markdown-it with html:false escapes the text; links only http(s) -->
      <div
        v-if="p.kind === 'prose'"
        class="md-text__prose"
        v-html="p.html"
      />
      <!-- eslint-enable vue/no-v-html -->
      <CodeSnippet
        v-else
        class="md-text__code"
        :code="p.code"
        :language="p.language || 'plaintext'"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.md-text {
  @apply flex flex-col gap-2 min-w-0 text-sm leading-relaxed;
  overflow-wrap: anywhere;
}

.md-text__prose {
  @apply min-w-0;

  :deep(> :first-child) {
    @apply mt-0;
  }

  :deep(> :last-child) {
    @apply mb-0;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(blockquote),
  :deep(table) {
    @apply my-2;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    @apply mt-3 mb-1 font-semibold;
  }

  :deep(h1) {
    @apply text-lg;
  }

  :deep(h2) {
    @apply text-base;
  }

  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    @apply text-sm;
  }

  :deep(ul) {
    @apply list-disc pl-5;
  }

  :deep(ol) {
    @apply list-decimal pl-5;
  }

  :deep(li) {
    @apply my-0.5;
  }

  :deep(strong) {
    @apply font-semibold;
  }

  :deep(code) {
    @apply px-1 py-0.5 rounded text-xs font-mono;
    @apply bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200;
  }

  :deep(a) {
    @apply text-blue-600 dark:text-blue-400 underline;
  }

  :deep(blockquote) {
    @apply pl-3 border-l-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400;
  }

  :deep(table) {
    @apply block overflow-x-auto text-xs;
  }

  :deep(th),
  :deep(td) {
    @apply px-2 py-1 border border-gray-200 dark:border-gray-700 text-left;
  }

  :deep(hr) {
    @apply my-3 border-gray-200 dark:border-gray-700;
  }

  :deep(.md-text__image) {
    @apply text-gray-500 dark:text-gray-400 italic;
  }
}

// A long line scrolls inside the code box, never the page.
.md-text__code {
  @apply min-w-0 max-w-full;

  :deep(pre) {
    @apply overflow-x-auto;
  }

  :deep(code.hljs) {
    @apply whitespace-pre;
    overflow-wrap: normal;
  }
}
</style>
