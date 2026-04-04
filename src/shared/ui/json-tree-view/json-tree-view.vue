<script lang="ts" setup>
import { computed } from 'vue'
import JsonTreeNode from './json-tree-node.vue'

type Props = {
  value: unknown
}

const props = defineProps<Props>()

const isObject = computed(
  () => props.value !== null && typeof props.value === 'object' && !Array.isArray(props.value)
)
const isArray = computed(() => Array.isArray(props.value))

const entries = computed(() => {
  if (isArray.value) {
    return (props.value as unknown[]).map((v, i) => ({
      key: i,
      value: v,
      path: `[${i}]`
    }))
  }
  if (isObject.value) {
    return Object.entries(props.value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v,
      path: k
    }))
  }
  return []
})

const isPrimitive = computed(() => !isObject.value && !isArray.value)
const isEmpty = computed(() => !isPrimitive.value && entries.value.length === 0)
const emptyLabel = computed(() => (isArray.value ? '[]' : '{}'))
</script>

<template>
  <div class="json-tree-view">
    <!-- Primitive root value -->
    <JsonTreeNode
      v-if="isPrimitive"
      :node-key="null"
      :value="value"
      :depth="0"
      path=""
    />

    <!-- Empty object/array -->
    <span
      v-else-if="isEmpty"
      class="json-tree-view__empty"
    >{{ emptyLabel }}</span>

    <!-- Object/Array root -->
    <template v-else>
      <JsonTreeNode
        v-for="entry in entries"
        :key="entry.key"
        :node-key="entry.key"
        :value="entry.value"
        :depth="0"
        :path="entry.path"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.json-tree-view {
  @apply p-3 rounded;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply overflow-x-auto;
}

.json-tree-view__empty {
  @apply font-mono text-xs text-gray-400 dark:text-gray-500 italic;
}
</style>
