<script lang="ts" setup>
import type { RayFrame } from '../../types'
import { RayFile } from '../ray-file'

type Props = {
  frames: RayFrame[]
}

defineProps<Props>()
</script>

<template>
  <div class="ray-trace">
    <div class="ray-trace__files">
      <RayFile
        v-for="frame in frames"
        :key="`${frame.file_name}-${frame.line_number}`"
        :file="frame"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-trace {
  @apply flex flex-col;
}

.ray-trace__files {
  @apply flex-col justify-center w-full border border-purple-300 dark:border-gray-400 rounded overflow-hidden;
}
</style>
