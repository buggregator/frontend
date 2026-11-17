<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useServerUpdateStore } from '@/entities/server-update/lib'

// A thin bar along the bottom edge of the header while an update runs. The
// pill next to it carries the words; this is decoration only.
const { indicator } = storeToRefs(useServerUpdateStore())
</script>

<template>
  <div
    v-if="indicator"
    class="update-topline"
    :class="{ 'update-topline--indeterminate': indicator.percent === null }"
    aria-hidden="true"
    data-test="update-topline"
  >
    <i :style="{ width: `${indicator.percent ?? 30}%` }" />
  </div>
</template>

<style lang="scss" scoped>
.update-topline {
  @apply absolute left-0 right-0 h-0.5 overflow-hidden pointer-events-none;
  bottom: -1px;

  i {
    @apply block h-full bg-blue-600 dark:bg-blue-400;
    transition: width 0.3s;
  }
}

.update-topline--indeterminate i {
  animation: update-topline-run 1.2s ease-in-out infinite;
}

@keyframes update-topline-run {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(340%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .update-topline i {
    transition: none;
    animation: none;
  }
}
</style>
