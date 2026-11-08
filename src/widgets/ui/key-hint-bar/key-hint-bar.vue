<script lang="ts" setup>
import { computed } from 'vue'
import { type HintBarId, hintsOf, useKeyHints } from '@/shared/lib/shortcuts'
import { KeyHints } from '@/shared/ui/key-hints'

type Props = {
  bar: HintBarId
}

const props = defineProps<Props>()

const { showHintBar } = useKeyHints()
const hints = computed(() => hintsOf(props.bar))
</script>

<template>
  <div
    v-if="showHintBar"
    class="key-hint-bar"
  >
    <KeyHints
      :hints="hints"
      label="Keyboard shortcuts on this page"
    />
  </div>
</template>

<style lang="scss" scoped>
// Floats in the corner, clear of the action toast (bottom centre). Not on
// narrow screens: phones have no keyboard to hint at.
.key-hint-bar {
  @apply hidden md:block fixed bottom-3 right-4 z-40;
  @apply px-3 py-1.5 rounded-lg;
  @apply bg-white/90 dark:bg-gray-900/90;
  @apply border border-gray-200 dark:border-gray-700;
  @apply shadow-sm;
  @apply pointer-events-none;
  backdrop-filter: blur(4px);
}
</style>
