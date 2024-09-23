<script lang="ts" setup>
import { TableBaseRow, TableBase, CodeSnippet } from '@/shared/ui';
import type { SentryContextApp } from '../../types';

type Props = {
  app: SentryContextApp;
};

defineProps<Props>();
</script>

<template>
  <section class="sentry-page-app">
    <h3 class="sentry-page-app__title">
      app
    </h3>

    <TableBase>
      <TableBaseRow
        v-if="app.type"
        title="App type"
      >
        {{ app.type }}
      </TableBaseRow>

      <TableBaseRow
        v-if="app.app_build"
        title="App Build"
      >
        {{ app.app_build }}
      </TableBaseRow>

      <TableBaseRow
        v-if="app.app_identifier"
        title="Build ID"
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
        title="Build Name"
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
          class="mt-3"
          language="json"
          :code="app.permissions"
        />
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-page-app {
  @apply py-5 px-4;
}

.sentry-page-app__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
