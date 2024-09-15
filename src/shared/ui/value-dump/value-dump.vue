<script lang="ts" setup>
import isString from 'lodash/isString'
import { computed, onMounted } from 'vue'
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

onMounted(() => {
  if (dumpId && window.Sfdump) {
    window.Sfdump(dumpId)
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
    <div v-if="!isValueString && !isValueCode" class="value-dump__html" v-html="dumpBody" />
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.value-dump {
  display: block;
}

.value-dump__html {
  @include code-example();
  @apply divide-gray-300 dark:divide-gray-600;
  @apply font-mono break-all text-2xs sm:text-xs md:text-sm lg:text-base;
  @apply p-1 md:p-3 lg:p-4;
}
</style>
