<script lang="ts" setup>
import { computed } from 'vue'
import { CodeSnippet } from '@/shared/ui'
import type { RayContentSQL } from '../../types'

type Props = {
  content: RayContentSQL
}

const props = defineProps<Props>()

const formattedSql = computed(() =>
  (props.content?.bindings || []).reduce(
    (result, binding) => (result || '').replace(/\?/, `'${binding}'`),
    props.content?.sql || ''
  )
)
</script>

<template>
  <div class="ray-query">
    <CodeSnippet
      language="sql"
      :code="formattedSql"
    />

    <div class="ray-query__meta">
      <div class="ray-query__item">
        <span class="ray-query__label">Connection</span>
        <span class="ray-query__value">{{ content.connection_name }}</span>
      </div>
      <div class="ray-query__item">
        <span class="ray-query__label">Time</span>
        <span class="ray-query__value">{{ content.time }}ms</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-query {
  @apply flex flex-col gap-1.5;
}

.ray-query__meta {
  @apply flex gap-4 px-1;
}

.ray-query__item {
  @apply flex items-center gap-1.5 text-xs;
}

.ray-query__label {
  @apply text-gray-400 dark:text-gray-500;
}

.ray-query__value {
  @apply font-mono text-gray-600 dark:text-gray-300;
}
</style>
