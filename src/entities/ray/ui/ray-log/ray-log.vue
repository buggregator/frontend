<script lang="ts" setup>
import { ValueDump } from '@/shared/ui'

type Props = {
  log: string | number
}

defineProps<Props>()
</script>

<template>
  <div class="ray-log">
    <ValueDump
      v-if="log"
      :value="String(log)"
    />
  </div>
</template>

<style lang="scss" scoped>
.ray-log {
  display: block;
}
</style>
