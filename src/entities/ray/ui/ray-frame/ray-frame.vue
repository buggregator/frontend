<script lang="ts" setup>
import { computed } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import type { RayFrame } from '../../types'

type Props = {
  frame: RayFrame
}

const props = defineProps<Props>()
const { buildLink } = useIdeLink()

const ideLink = computed(() => buildLink(props.frame.file_name, props.frame.line_number))
</script>

<template>
  <div class="ray-frame">
    <span class="ray-frame__label">Called from</span>
    <a
      v-if="ideLink"
      class="ray-frame__link"
      :href="ideLink"
    >
      <code class="ray-frame__code">{{ frame.class || 'null' }}:{{ frame.method }}</code>
    </a>
    <code
      v-else
      class="ray-frame__code"
    >{{ frame.class || 'null' }}:{{ frame.method }}</code>
  </div>
</template>

<style lang="scss" scoped>
.ray-frame {
  @apply flex items-center gap-2 text-xs;
}

.ray-frame__label {
  @apply text-gray-400 dark:text-gray-500;
}

.ray-frame__link {
  @apply text-blue-500 dark:text-blue-400 hover:underline;
}

.ray-frame__code {
  @apply font-mono font-medium break-all;
}
</style>
