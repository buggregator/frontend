<script lang="ts" setup>
import { computed } from 'vue'
import { EmailHtmlFrame, ValueDump } from '@/shared/ui'
import type { RayContentCustom } from '../../types'

type Props = {
  content: RayContentCustom
}

const props = defineProps<Props>()

// ray()->html() sends a custom payload labelled «HTML»: the sender's own
// markup, shown as a page (its CSS and scripts run in the sandbox: opaque
// origin: no app page, login or storage), not as tags.
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
        scripts
        fit
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
  // White as in mail previews; the frame takes the page's height.
  @apply rounded bg-white overflow-hidden;
}

.ray-custom__frame {
  @apply block w-full border-0;
}
</style>
