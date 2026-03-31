<script lang="ts" setup>
import isString from 'lodash.isstring'
import { computed, onMounted } from 'vue'
import { callSfDump } from '../../lib/vendor/sf-dumper'
import { CodeSnippet } from '../code-snippet'

type Props = {
  value: string | number | boolean
  type?: string
  language?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: '',
  language: 'plaintext'
})

const isValueString = computed(() => isString(props.value) && props.type === 'string')
const isValueCode = computed(() => isString(props.value) && props.type === 'code')
const isValueBoolean = computed(() => props.type === 'boolean')

const dumpId = String(props.value).match(/(sf-dump-[0-9]+)/i)?.[0] || null
const dumpBody = computed(() => {
  if (props.type === 'boolean') {
    return props.value === '1' ? 'true' : 'false'
  }

  if (isValueString.value) {
    return `"${props.value}"`
  }

  return props.value
})

const baseSanitizedHtml = computed(() => {
  return String(props.value)
    .replace(/<script.*<\/script>/g, '')
    .replace(/<style.*<\/style>/g, '')
})

onMounted(() => {
  if (dumpId) {
    callSfDump(dumpId)
  }
})
</script>

<template>
  <div class="value-dump">
    <CodeSnippet
      v-if="isValueString || isValueCode"
      :language="language"
      :code="String(dumpBody)"
    />
    <div
      v-else-if="isValueBoolean"
      class="value-dump__boolean"
      :class="dumpBody === 'true' ? 'value-dump__boolean--true' : 'value-dump__boolean--false'"
    >
      {{ dumpBody }}
    </div>
    <div
      v-else
      class="value-dump__html"
      v-html="baseSanitizedHtml"
    />
  </div>
</template>

<style lang="scss" scoped>
.value-dump {
  display: block;
}

.value-dump__html {
  @apply font-mono break-all text-xs;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply rounded overflow-auto;
  @apply p-3;
}

.value-dump__boolean {
  @apply font-mono font-semibold text-xs;
  @apply rounded p-3;
}

.value-dump__boolean--true {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.value-dump__boolean--false {
  @apply text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10;
}
</style>
