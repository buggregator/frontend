<script lang="ts" setup>
import highlightPlugin from '@highlightjs/vue-plugin'
import isString from 'lodash.isstring'
import { ref, computed, toRef } from 'vue'
import { copyTextToClipboard } from '../../lib/clipboard'
import { useHighlightLanguage } from '../../lib/highlight'
import { logger } from '../../lib/logger'
import { IconSvg } from '../icon-svg'

const CodeHighlight = highlightPlugin.component

type Props = {
  code?: string | Record<string, unknown> | Array<unknown> | null
  language?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'plaintext',
  code: ''
})

const isCopied = ref(false)

const highlightLanguage = useHighlightLanguage(toRef(props, 'language'))

const normalizedCode = computed(() =>
  !isString(props.code) ? JSON.stringify(props.code, null, ' ') : props.code
)

const copyCode = (): void => {
  isCopied.value = true

  copyTextToClipboard(normalizedCode.value)
    .then(() => {
      setTimeout(() => {
        isCopied.value = false
      }, 1500)
    })
    .catch((e) => {
      logger(['UI: Failed to copy code to clipboard', e])
    })
}
</script>

<template>
  <div class="code-snippet">
    <button
      type="button"
      class="code-snippet__copy"
      :class="{ 'code-snippet__copy--active': isCopied }"
      aria-label="Copy code"
      @click.stop="copyCode"
    >
      <IconSvg
        :name="isCopied ? 'copy' : 'copy'"
        class="code-snippet__copy-icon"
      />
      <span class="code-snippet__copy-text">{{ isCopied ? 'Copied' : 'Copy' }}</span>
    </button>

    <CodeHighlight
      :language="highlightLanguage"
      :autodetect="false"
      :code="normalizedCode"
    />
  </div>
</template>

<style lang="scss" scoped>
.code-snippet {
  @apply relative rounded overflow-hidden;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;

  :deep(pre) {
    @apply m-0;
  }

  :deep(code.hljs) {
    @apply text-gray-700 dark:text-gray-300;
    @apply p-4 text-xs leading-relaxed;
    background: inherit !important;
  }
}

/* highlight.js ships one theme (github-dark); on the light snippet its token
   colors fall to 1.9-3:1. These are GitHub Light's token colors (4.6:1 and up on gray-50). */
:global(html:not(.dark) .code-snippet .hljs-keyword),
:global(html:not(.dark) .code-snippet .hljs-doctag),
:global(html:not(.dark) .code-snippet .hljs-meta .hljs-keyword),
:global(html:not(.dark) .code-snippet .hljs-template-tag),
:global(html:not(.dark) .code-snippet .hljs-template-variable),
:global(html:not(.dark) .code-snippet .hljs-type),
:global(html:not(.dark) .code-snippet .hljs-variable.language_) {
  color: #cf222e;
}

:global(html:not(.dark) .code-snippet .hljs-title),
:global(html:not(.dark) .code-snippet .hljs-title.class_),
:global(html:not(.dark) .code-snippet .hljs-title.function_) {
  color: #8250df;
}

:global(html:not(.dark) .code-snippet .hljs-attr),
:global(html:not(.dark) .code-snippet .hljs-attribute),
:global(html:not(.dark) .code-snippet .hljs-literal),
:global(html:not(.dark) .code-snippet .hljs-meta),
:global(html:not(.dark) .code-snippet .hljs-number),
:global(html:not(.dark) .code-snippet .hljs-operator),
:global(html:not(.dark) .code-snippet .hljs-variable),
:global(html:not(.dark) .code-snippet .hljs-selector-attr),
:global(html:not(.dark) .code-snippet .hljs-selector-class),
:global(html:not(.dark) .code-snippet .hljs-selector-id) {
  color: #0550ae;
}

:global(html:not(.dark) .code-snippet .hljs-regexp),
:global(html:not(.dark) .code-snippet .hljs-string),
:global(html:not(.dark) .code-snippet .hljs-meta .hljs-string) {
  color: #0a3069;
}

:global(html:not(.dark) .code-snippet .hljs-built_in),
:global(html:not(.dark) .code-snippet .hljs-symbol) {
  color: #953800;
}

:global(html:not(.dark) .code-snippet .hljs-comment),
:global(html:not(.dark) .code-snippet .hljs-code),
:global(html:not(.dark) .code-snippet .hljs-formula) {
  color: #57606a;
}

:global(html:not(.dark) .code-snippet .hljs-name),
:global(html:not(.dark) .code-snippet .hljs-quote),
:global(html:not(.dark) .code-snippet .hljs-selector-tag),
:global(html:not(.dark) .code-snippet .hljs-selector-pseudo) {
  color: #116329;
}

.code-snippet__copy {
  @apply opacity-0 flex items-center gap-1 absolute top-2 right-2;
  @apply px-1.5 py-0.5 rounded text-2xs font-medium;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-all duration-150;

  .code-snippet:hover & {
    @apply opacity-100;
  }
}

.code-snippet__copy--active {
  @apply opacity-100 text-green-700 dark:text-green-400;
}

.code-snippet__copy-icon {
  @apply w-3 h-3;
}

.code-snippet__copy-text {
  @apply hidden sm:inline;
}
</style>
