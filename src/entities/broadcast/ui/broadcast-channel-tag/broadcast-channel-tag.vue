<script lang="ts" setup>
import { computed } from 'vue'
import { channelKind, channelKindLabel, channelShortName } from '../../lib/payload'

// A channel as text, not colour: its kind («private», «#» for public), then
// the name without the prefix the kind says.
const props = defineProps<{ channel: string }>()

const kind = computed(() => channelKind(props.channel))
</script>

<template>
  <span
    class="bc-tag"
    :title="channel"
  >
    <span class="bc-tag__kind">{{ channelKindLabel(kind) }}</span>
    <span class="bc-tag__name">{{ channelShortName(channel) }}</span>
  </span>
</template>

<style lang="scss" scoped>
.bc-tag {
  @apply inline-flex items-center gap-1 px-1.5 rounded-sm border min-w-0 max-w-full;
  @apply font-mono text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}

.bc-tag__kind {
  @apply text-gray-600 dark:text-gray-400 flex-none;
}

.bc-tag__name {
  @apply truncate;
}
</style>
