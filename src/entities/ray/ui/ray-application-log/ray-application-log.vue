<script lang="ts" setup>
import { CodeSnippet } from '@/shared/ui'
import type { RayContentApplicationLog } from '../../types'

type Props = {
  content: RayContentApplicationLog
}

defineProps<Props>()
</script>

<template>
  <CodeSnippet :code="content.value" />
</template>
