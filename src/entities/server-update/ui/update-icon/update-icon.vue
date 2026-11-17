<script lang="ts" setup>
import { UPDATE_ICON_PATHS as PATHS, type UpdateIconName } from './update-icon-paths'

// Line icons of the update block (24 × 24, stroke = currentColor). Always
// next to a word: state is never told by an icon or a colour alone.
defineProps<{ name: UpdateIconName }>()
</script>

<template>
  <svg
    class="update-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(d, index) in PATHS[name]"
      :key="index"
      :d="d"
    />
  </svg>
</template>

<style lang="scss" scoped>
.update-icon {
  @apply w-4 h-4 flex-none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
