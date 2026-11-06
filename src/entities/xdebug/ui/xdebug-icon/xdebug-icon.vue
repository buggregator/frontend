<script lang="ts" setup>
import { XDEBUG_ICON_PATHS as PATHS, type XdebugIconName } from './xdebug-icon-paths'

defineProps<{ name: XdebugIconName }>()
</script>

<template>
  <svg
    class="xdebug-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>

<style lang="scss" scoped>
.xdebug-icon {
  @apply inline-block w-3 h-3 shrink-0 fill-current;
}
</style>
