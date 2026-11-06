<script lang="ts" setup>
import { computed } from 'vue'
import { pathParts } from '../../lib/mock-rule'

type Props = {
  path: string
  // show the /mock prefix in muted text
  prefix?: boolean
  // one line with an ellipsis; the full path goes to `title`
  truncate?: boolean
}

const props = withDefaults(defineProps<Props>(), { prefix: false, truncate: false })

const parts = computed(() => pathParts(props.path))
</script>

<template>
  <span
    class="mock-path"
    :class="{ 'mock-path--truncate': truncate }"
    :title="truncate ? (prefix ? '/mock' : '') + path : undefined"
  ><span
    v-if="prefix"
    class="mock-path__prefix"
  >/mock</span><span
    v-for="(part, i) in parts"
    :key="i"
    :class="`mock-path__${part.kind}`"
  >{{
    part.text
  }}</span></span>
</template>

<style lang="scss" scoped>
.mock-path {
  @apply font-mono text-xs text-gray-900 dark:text-white min-w-0;
  overflow-wrap: anywhere;
}

.mock-path--truncate {
  @apply truncate;
}

.mock-path__prefix {
  @apply text-gray-500 dark:text-gray-400;
}

.mock-path__param {
  @apply text-violet-700 dark:text-violet-400;
}

.mock-path__wildcard {
  @apply text-amber-700 dark:text-amber-400 font-bold;
}
</style>
