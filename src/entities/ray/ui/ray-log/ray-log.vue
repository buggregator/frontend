<script lang="ts" setup>
import { CodeSnippet } from '@/shared/ui'

type Props = {
  log: string | number
}

defineProps<Props>()
</script>

<template>
  <CodeSnippet
    v-if="log"
    :code="String(log)"
  />
</template>
