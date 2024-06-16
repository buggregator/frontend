<script lang="ts" setup>
import { computed } from "vue";
import { useFormats } from "../../lib/formats";
import { REST_API_URL } from "../../lib/io";
import type { Attachment } from "../../types";

const { formatFileSize } = useFormats();

type Props = {
  eventId: string;
  attachment: Attachment;
  downloadUrl?: string;
};

const props = defineProps<Props>();
const size = computed(() => formatFileSize(props.attachment.size || 0));
</script>

<template>
  <component
    :is="downloadUrl ? 'a' : 'div'"
    :href="downloadUrl || 'javascript:void(0)'"
    target="_blank"
    class="file-attachment"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 50 50"
      width="25px"
      height="25px"
    >
      <path
        d="M 7 2 L 7 48 L 43 48 L 43 14.59375 L 42.71875 14.28125 L 30.71875 2.28125 L 30.40625 2 Z M 9 4 L 29 4 L 29 16 L 41 16 L 41 46 L 9 46 Z M 31 5.4375 L 39.5625 14 L 31 14 Z"
      />
    </svg>
    <div class="file-attachment__meta">
      <div class="file-attachment__name">
        {{ attachment.name }}
      </div>
      <div class="file-attachment__size">({{ size }})</div>
    </div>
  </component>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.file-attachment {
  @apply border border-gray-300 px-3 py-2 flex items-center;

  > svg {
    @apply mr-3;
  }
}

.file-attachment__meta {
  @apply flex flex-col justify-start;
}

.file-attachment__name {
  @apply font-bold text-xs;
}

.file-attachment__size {
  @apply text-xs;
}
</style>
