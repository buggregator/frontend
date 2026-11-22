<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  CodeSnippet,
  EmailHtmlFrame,
  EmailPreview,
  EmailPreviewDevice,
  SegmentedControl,
  type SegmentedOption,
} from '@/shared/ui'
import { isCalendarPart, isHtmlPart } from '../../lib/smtp-parts'
import type { SMTPPart } from '../../types'

// One other version of the body (#6829). Apple Watch and AMP are HTML: the
// same sandboxed frame as the main HTML (AMP scripts do not run) and the
// source; the calendar is iCalendar source; the rest is text.
type Props = {
  part: SMTPPart
}

const props = defineProps<Props>()

const html = computed(() => isHtmlPart(props.part.type))
const language = computed(() => (html.value ? 'html' : 'plaintext'))

type View = 'preview' | 'source'
const view = ref<View>('preview')
const views: SegmentedOption<View>[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'source', label: 'Source' },
]

const isAmp = computed(() => props.part.type.toLowerCase() === 'text/x-amp-html')
// The Apple Watch screen is narrow: the phone frame is the closest.
const device = computed(() =>
  props.part.type.toLowerCase() === 'text/watch-html' ? EmailPreviewDevice.Mobile : EmailPreviewDevice.Desktop
)
</script>

<template>
  <div class="smtp-part">
    <div class="smtp-part__bar">
      <span class="smtp-part__type">{{ part.type }}</span>
      <span
        v-if="part.truncated"
        class="smtp-part__note"
        data-test="part-truncated"
      >Cut at 1 MB — the whole message is in Raw</span>
      <span
        v-else-if="isAmp"
        class="smtp-part__note"
      >AMP scripts do not run here: a static view</span>
      <SegmentedControl
        v-if="html"
        v-model="view"
        class="smtp-part__switch"
        :options="views"
        :label="`${part.label} view`"
        size="sm"
      />
    </div>

    <EmailPreview
      v-if="html && view === 'preview'"
      :device="device"
    >
      <EmailHtmlFrame
        class="smtp-part__frame"
        :html="part.content"
        :title="`${part.label} preview`"
      />
    </EmailPreview>

    <CodeSnippet
      v-else-if="html || isCalendarPart(part.type)"
      :language="language"
      :code="part.content"
    />

    <pre
      v-else
      class="smtp-part__text"
    >{{ part.content }}</pre>
  </div>
</template>

<style lang="scss" scoped>
.smtp-part__bar {
  @apply flex flex-wrap items-center gap-2 px-3 py-2;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.smtp-part__type {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400;
}

.smtp-part__note {
  @apply text-2xs text-amber-700 dark:text-amber-400;
}

.smtp-part__switch {
  @apply ml-auto;
}

.smtp-part__frame {
  @apply w-full h-full;
}

.smtp-part__text {
  @apply text-sm font-mono p-4 whitespace-pre-wrap break-words;
  @apply text-gray-700 dark:text-gray-200;
  @apply bg-white dark:bg-gray-800;
  @apply min-h-[300px];
}
</style>
