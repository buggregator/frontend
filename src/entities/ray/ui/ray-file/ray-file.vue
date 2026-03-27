<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { IconSvg } from '@/shared/ui'
import type { RayFrame } from '../../types'

type Props = {
  file: RayFrame
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

const collapsed = ref(props.isOpen)
const { buildLink } = useIdeLink()

const ideLink = computed(() => buildLink(props.file.file_name, props.file.line_number))

const hasSnippets = computed(() => (props.file.snippet ? props.file.snippet.length > 0 : false))
</script>

<template>
  <div
    class="ray-file"
    @click="collapsed = !collapsed"
  >
    <div class="ray-file__header">
      <div
        class="ray-file__title"
        :title="file.file_name"
      >
        <span class="ray-file__fn">{{ file.class || 'null' }}:{{ file.method }}</span>
        <span class="ray-file__meta">at line {{ file.line_number }}</span>
        <a
          v-if="ideLink"
          :href="ideLink"
          class="ray-file__path ray-file__path--link"
          @click.stop
        >{{
          file.file_name
        }}</a>
        <span
          v-else
          class="ray-file__path"
        >{{ file.file_name }}</span>
      </div>

      <IconSvg
        v-if="hasSnippets"
        class="ray-file__chevron"
        name="collapsed"
        :class="{ 'ray-file__chevron--open': !collapsed }"
      />
    </div>

    <div
      v-if="hasSnippets && !collapsed"
      class="ray-file__body"
    >
      <div
        v-for="line in file.snippet"
        :key="line.line_number"
        class="ray-file__line"
        :class="{ 'ray-file__line--active': file.line_number === line.line_number }"
      >
        <span class="ray-file__line-num">{{ line.line_number }}</span>
        <pre class="ray-file__line-text">{{ line.text }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-file {
  @apply text-xs cursor-pointer;
  @apply border-b border-gray-200 dark:border-gray-700;

  &:last-child {
    @apply border-b-0;
  }
}

.ray-file__header {
  @apply py-2 px-3 flex justify-between items-start gap-2;
  @apply bg-gray-50 dark:bg-gray-800/50;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
}

.ray-file__title {
  @apply flex flex-col gap-0.5;
}

.ray-file__fn {
  @apply font-semibold text-gray-800 dark:text-gray-200 break-all;
}

.ray-file__meta {
  @apply text-gray-400 dark:text-gray-500 text-2xs;
}

.ray-file__path {
  @apply text-gray-400 dark:text-gray-500 text-2xs break-all;
}

.ray-file__path--link {
  @apply text-blue-500 dark:text-blue-400 hover:underline cursor-pointer;
}

.ray-file__chevron {
  @apply w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500;
  transition: transform 0.15s ease;
}

.ray-file__chevron--open {
  transform: rotate(180deg);
}

.ray-file__body {
  @apply bg-gray-900 p-2 overflow-x-auto font-mono;
}

.ray-file__line {
  @apply flex text-gray-400;
}

.ray-file__line--active {
  @apply bg-blue-900/50 text-gray-100;
}

.ray-file__line-num {
  @apply w-10 text-right pr-3 select-none text-gray-600 flex-shrink-0;
}

.ray-file__line-text {
  @apply flex-1;
}
</style>
