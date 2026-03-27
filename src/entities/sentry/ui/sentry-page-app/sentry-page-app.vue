<script lang="ts" setup>
import { TableBaseRow, TableBase, CodeSnippet } from '@/shared/ui'
import type { SentryContextApp } from '../../types'

type Props = {
  app: SentryContextApp
}

defineProps<Props>()
</script>

<template>
  <section>
    <h3 class="section-title">
      App
    </h3>

    <TableBase>
      <TableBaseRow
        v-if="app.type"
        title="Type"
      >
        {{ app.type }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.app_build"
        title="Build"
      >
        {{ app.app_build }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.app_identifier"
        title="Identifier"
      >
        {{ app.app_identifier }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.app_id"
        title="ID"
      >
        {{ app.app_id }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.app_name"
        title="Name"
      >
        {{ app.app_name }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.app_version"
        title="Version"
      >
        {{ app.app_version }}
      </TableBaseRow>
      <TableBaseRow
        v-if="app.permissions"
        title="Permissions"
      >
        <CodeSnippet
          language="json"
          :code="app.permissions"
        />
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
.section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}
</style>
