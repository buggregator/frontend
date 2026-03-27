<script lang="ts" setup>
import { computed, withDefaults } from 'vue'
import type { RayContentException } from '../../types'
import { RayFile } from '../ray-file'

const RAY_MAX_EXCEPTION_FRAMES = 10

type Props = {
  exception: RayContentException
  maxFrames?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 0
})

const exceptionFrames = computed(() => {
  const frames = props.exception.frames || []

  return frames.slice(0 - RAY_MAX_EXCEPTION_FRAMES).reverse()
})
</script>

<template>
  <div class="ray-exception">
    <header class="ray-exception__header">
      <h3 class="ray-exception__title">
        {{ exception.class }}
      </h3>

      <pre class="ray-exception__message">{{ exception.message }}</pre>
    </header>

    <div class="ray-exception__files">
      <RayFile
        v-for="(file, i) in exceptionFrames"
        :key="i"
        :file="file"
        :is-open="i !== 0"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-exception {
  @apply flex flex-col rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.ray-exception__header {
  @apply bg-gray-50 dark:bg-gray-900 p-3;
}

.ray-exception__title {
  @apply mb-2 font-semibold text-sm;
}

.ray-exception__message {
  @apply text-xs break-words whitespace-pre-wrap;
  @apply p-2 rounded font-mono;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
}

.ray-exception__files {
  @apply flex flex-col;
  @apply border-t border-gray-200 dark:border-gray-700;
}
</style>
