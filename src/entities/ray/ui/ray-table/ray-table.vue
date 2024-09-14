<script lang="ts" setup>
import { CodeSnippet, TableBase, TableBaseRow } from '@/shared/ui'
import type { RayContentObject } from '../../types'

type Props = {
  table: RayContentObject
}

defineProps<Props>()
</script>

<template>
  <div class="ray-table">
    <TableBase>
      <TableBaseRow v-for="(value, title) in table.values" :key="title" :title="String(title)">
        <CodeSnippet language="plaintext" :code="value" />
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-table {
  display: block;
}
</style>
