<script lang="ts" setup>
import { computed, ref } from 'vue'
import { copyTextToClipboard } from '../../lib/clipboard'

type Props = {
  nodeKey: string | number | null
  value: unknown
  depth: number
  path: string
}

const props = defineProps<Props>()

const isObject = computed(
  () => props.value !== null && typeof props.value === 'object' && !Array.isArray(props.value)
)
const isArray = computed(() => Array.isArray(props.value))
const isExpandable = computed(() => isObject.value || isArray.value)
const isCollapsed = ref(props.depth > 1)
const toggle = () => {
  isCollapsed.value = !isCollapsed.value
}

const childEntries = computed(() => {
  if (isArray.value) {
    return (props.value as unknown[]).map((v, i) => ({
      key: i,
      value: v,
      path: props.path ? `${props.path}[${i}]` : `[${i}]`
    }))
  }
  if (isObject.value) {
    return Object.entries(props.value as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v,
      path: props.path ? `${props.path}.${k}` : k
    }))
  }
  return []
})

const childCount = computed(() => childEntries.value.length)
const bracketOpen = computed(() => (isArray.value ? '[' : '{'))
const bracketClose = computed(() => (isArray.value ? ']' : '}'))
const collapsedLabel = computed(() =>
  isArray.value ? `[${childCount.value} items]` : `{${childCount.value} keys}`
)

const valueType = computed(() => {
  if (props.value === null) return 'null'
  if (typeof props.value === 'boolean') return 'boolean'
  if (typeof props.value === 'number') return 'number'
  if (typeof props.value === 'string') return 'string'
  return 'other'
})

const isLongString = computed(
  () => valueType.value === 'string' && (props.value as string).length > 100
)
const isStringExpanded = ref(false)
const displayString = computed(() => {
  const s = props.value as string
  if (!isLongString.value || isStringExpanded.value) return s
  return s.slice(0, 100)
})

const isCopied = ref(false)
const copyPath = () => {
  if (!props.path) return
  isCopied.value = true
  copyTextToClipboard(props.path).catch(console.error)
  setTimeout(() => {
    isCopied.value = false
  }, 1500)
}
</script>

<template>
  <div class="json-node">
    <div class="json-node__line">
      <!-- Toggle arrow -->
      <button
        v-if="isExpandable"
        class="json-node__toggle"
        @click="toggle"
      >
        <span :class="isCollapsed ? 'json-node__arrow--right' : 'json-node__arrow--down'">▶</span>
      </button>
      <span
        v-else
        class="json-node__spacer"
      />

      <!-- Key -->
      <span
        v-if="nodeKey !== null"
        class="json-node__key"
        :title="isCopied ? 'Copied!' : `Copy path: ${path}`"
        @click="copyPath"
      >{{ nodeKey }}<span class="json-node__colon">:</span></span>

      <!-- Expandable collapsed -->
      <template v-if="isExpandable && isCollapsed">
        <span
          class="json-node__collapsed"
          @click="toggle"
        >{{ collapsedLabel }}</span>
      </template>

      <!-- Expandable expanded (opening bracket) -->
      <template v-if="isExpandable && !isCollapsed">
        <span class="json-node__bracket">{{ bracketOpen }}</span>
      </template>

      <!-- Primitive values -->
      <template v-if="!isExpandable">
        <span
          v-if="valueType === 'null'"
          class="json-node__value json-node__value--null"
        >null</span>
        <span
          v-else-if="valueType === 'boolean'"
          class="json-node__value json-node__value--boolean"
        >{{ value }}</span>
        <span
          v-else-if="valueType === 'number'"
          class="json-node__value json-node__value--number"
        >{{ value }}</span>
        <span
          v-else-if="valueType === 'string'"
          class="json-node__value json-node__value--string"
        >"{{ displayString }}"<button
          v-if="isLongString"
          class="json-node__expand-str"
          @click="isStringExpanded = !isStringExpanded"
        >
          {{ isStringExpanded ? 'collapse' : '…expand' }}
        </button></span>
      </template>
    </div>

    <!-- Children -->
    <div
      v-if="isExpandable && !isCollapsed"
      class="json-node__children"
    >
      <JsonTreeNode
        v-for="child in childEntries"
        :key="child.key"
        :node-key="child.key"
        :value="child.value"
        :depth="depth + 1"
        :path="child.path"
      />
    </div>

    <!-- Closing bracket -->
    <div
      v-if="isExpandable && !isCollapsed"
      class="json-node__line"
    >
      <span class="json-node__spacer" />
      <span class="json-node__bracket">{{ bracketClose }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.json-node {
  @apply font-mono text-xs leading-relaxed;
}

.json-node__line {
  @apply flex items-start gap-0;
  padding-left: 0;
}

.json-node__toggle {
  @apply w-4 h-4 flex items-center justify-center cursor-pointer flex-shrink-0;
  @apply text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300;
  font-size: 8px;
}

.json-node__arrow--right {
  display: inline-block;
  transition: transform 0.1s;
}

.json-node__arrow--down {
  display: inline-block;
  transform: rotate(90deg);
  transition: transform 0.1s;
}

.json-node__spacer {
  @apply w-4 flex-shrink-0 inline-block;
}

.json-node__key {
  @apply text-purple-700 dark:text-purple-400 cursor-pointer flex-shrink-0;
  @apply hover:underline;
}

.json-node__colon {
  @apply text-gray-500 dark:text-gray-400 mr-1;
}

.json-node__bracket {
  @apply text-gray-500 dark:text-gray-400;
}

.json-node__collapsed {
  @apply text-gray-400 dark:text-gray-500 cursor-pointer;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
}

.json-node__value--null {
  @apply text-gray-400 dark:text-gray-500 italic;
}

.json-node__value--boolean {
  @apply text-amber-600 dark:text-amber-400;
}

.json-node__value--number {
  @apply text-blue-600 dark:text-blue-400;
}

.json-node__value--string {
  @apply text-green-700 dark:text-green-400;
  word-break: break-all;
}

.json-node__expand-str {
  @apply text-2xs text-gray-400 dark:text-gray-500 ml-1 cursor-pointer;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
}

.json-node__children {
  padding-left: 16px;
}
</style>
