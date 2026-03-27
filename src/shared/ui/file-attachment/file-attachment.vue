<script lang="ts" setup>
import { computed } from 'vue'
import { useFormats } from '../../lib/formats'
import type { Attachment } from '../../types'
import { IconSvg } from '../icon-svg'

const { formatFileSize } = useFormats()

type Props = {
  eventId: string
  attachment: Attachment
  downloadUrl?: string
}

const props = defineProps<Props>()
const size = computed(() => formatFileSize(props.attachment.size || 0))
</script>

<template>
  <component
    :is="downloadUrl ? 'a' : 'div'"
    :href="downloadUrl || undefined"
    target="_blank"
    class="file-attachment"
  >
    <div class="file-attachment__icon">
      <IconSvg
        name="file-download"
        class="file-attachment__icon-svg"
      />
    </div>
    <div class="file-attachment__info">
      <span class="file-attachment__name">{{ attachment.name }}</span>
      <span class="file-attachment__meta">
        <span class="file-attachment__size">{{ size }}</span>
        <span
          v-if="attachment.mime"
          class="file-attachment__mime"
        >{{ attachment.mime }}</span>
      </span>
    </div>
  </component>
</template>

<style lang="scss" scoped>
.file-attachment {
  @apply flex items-center gap-3 px-3 py-2.5 rounded;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
  @apply cursor-pointer;
}

.file-attachment__icon {
  @apply flex-shrink-0 w-8 h-8 flex items-center justify-center rounded;
  @apply bg-gray-200 dark:bg-gray-700;
  @apply text-gray-500 dark:text-gray-400;
}

.file-attachment__icon-svg {
  @apply w-4 h-4;
}

.file-attachment__info {
  @apply flex flex-col min-w-0;
}

.file-attachment__name {
  @apply text-xs font-medium truncate;
}

.file-attachment__meta {
  @apply flex items-center gap-2 mt-0.5;
}

.file-attachment__size {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400;
}

.file-attachment__mime {
  @apply text-2xs text-gray-400 dark:text-gray-500;
}
</style>
