<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { IconSvg } from '@/shared/ui'
import { fillSegments, fillText } from './fill'

// One stack's snippet with this server's values filled in, and Copy (#5941).
type Props = {
  code: string
  file: string
  values: Record<string, string>
}

const props = defineProps<Props>()

// Vue escapes the text; filled values are marked by shape (dotted underline).
const segments = computed(() => fillSegments(props.code, props.values))
const text = computed(() => fillText(props.code, props.values))

const state = ref<'idle' | 'copied' | 'failed'>('idle')
const codeEl = ref<HTMLElement | null>(null)
const failId = useId()
let timer: ReturnType<typeof setTimeout> | undefined

const copy = async () => {
  clearTimeout(timer)
  try {
    await copyTextToClipboard(text.value)
    state.value = 'copied'
    timer = setTimeout(() => (state.value = 'idle'), 2000)
  } catch {
    state.value = 'failed'
    // The text is selected, so Ctrl+C still works.
    const sel = window.getSelection()
    if (sel && codeEl.value) {
      const range = document.createRange()
      range.selectNodeContents(codeEl.value)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }
}

watch(text, () => {
  clearTimeout(timer)
  state.value = 'idle'
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="setup-code">
    <div class="setup-code__bar">
      <span class="setup-code__file">{{ file }}</span>
      <button
        type="button"
        class="setup-code__copy"
        :class="{
          'setup-code__copy--ok': state === 'copied',
          'setup-code__copy--fail': state === 'failed'
        }"
        :aria-describedby="state === 'failed' ? failId : undefined"
        data-test="setup-copy"
        @click="copy"
      >
        <svg
          v-if="state === 'copied'"
          class="setup-code__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg
          v-else-if="state === 'failed'"
          class="setup-code__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
          />
        </svg>
        <IconSvg
          v-else
          name="copy"
          class="setup-code__icon"
        />
        {{ state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy' }}
      </button>
    </div>
    <pre
      class="setup-code__pre"
      data-test="setup-code"
    ><code ref="codeEl"><template
      v-for="(seg, i) in segments"
      :key="i"
    ><span
      v-if="seg.fill"
      class="setup-code__fill"
    >{{ seg.text }}</span><template v-else>{{ seg.text }}</template></template></code></pre>
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ state === 'copied' ? 'Copied to clipboard' : '' }}
    </p>
    <p
      v-if="state === 'failed'"
      :id="failId"
      class="setup-code__fail-note"
    >
      The browser blocked the clipboard. The text is selected: press Ctrl+C (⌘C on Mac).
    </p>
  </div>
</template>

<style lang="scss" scoped>
.setup-code {
  @apply rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900;
}

.setup-code__bar {
  @apply flex items-center justify-between gap-2 h-8 pl-3 pr-1.5;
  @apply border-b border-gray-200 dark:border-gray-700;

  @media (max-width: 639px) {
    @apply h-11;
  }
}

.setup-code__file {
  @apply font-mono text-xs text-gray-600 dark:text-gray-400 truncate;
}

.setup-code__copy {
  @apply relative inline-flex items-center gap-1 h-6 px-2 rounded text-xs font-medium flex-shrink-0;
  @apply text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;
  @apply focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900;

  @media (max-width: 639px) {
    @apply h-8;

    // 44 px to tap.
    &::after {
      content: '';
      @apply absolute -inset-y-1.5 inset-x-0;
    }
  }
}

.setup-code__copy--ok {
  @apply text-green-700 dark:text-green-400;
}

.setup-code__copy--fail {
  @apply text-amber-700 dark:text-amber-400;
}

.setup-code__icon {
  @apply w-3.5 h-3.5;
}

.setup-code__pre {
  @apply m-0 px-3 py-2.5 font-mono text-[13px] leading-[1.6] text-gray-800 dark:text-gray-300;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  // JetBrains Mono would turn -> and // into arrows.
  font-variant-ligatures: none;
  font-feature-settings:
    'calt' 0,
    'liga' 0;
}

.setup-code__fill {
  @apply font-semibold text-gray-950 dark:text-white;
  @apply underline decoration-dotted decoration-1 underline-offset-[3px] decoration-gray-500 dark:decoration-gray-400;
}

.setup-code__fail-note {
  @apply m-0 px-3 pb-2.5 text-xs text-amber-700 dark:text-amber-400;
}
</style>
