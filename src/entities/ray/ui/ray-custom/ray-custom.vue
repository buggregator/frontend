<script lang="ts" setup>
import { computed } from 'vue'
import { EmailHtmlFrame, ValueDump } from '@/shared/ui'
import type { RayContentCustom } from '../../types'

type Props = {
  content: RayContentCustom
}

const props = defineProps<Props>()

// ray()->html() sends a custom payload labelled «HTML»: the sender's own
// markup, shown as a page in the mail sandbox (no scripts), not as tags.
const isHtml = computed(() => props.content.label === 'HTML')
</script>

<template>
  <div class="ray-custom">
    <div
      v-if="isHtml"
      class="ray-custom__html"
      data-test="ray-html"
    >
      <EmailHtmlFrame
        class="ray-custom__frame"
        :html="String(content.content ?? '')"
        title="Ray HTML"
      />
    </div>
    <ValueDump
      v-else
      :value="String(content.content)"
    />
  </div>
</template>

<style lang="scss" scoped>
.ray-custom__html {
  // White as in mail previews; drag the corner for a taller page.
  @apply h-60 min-h-24 overflow-hidden rounded bg-white;
  @apply border border-gray-200 dark:border-gray-700;
  resize: vertical;
}

.ray-custom__frame {
  // Beats the 60vh min-height the mail preview sets on every iframe.
  @apply block w-full h-full min-h-0 border-0;
}
</style>
