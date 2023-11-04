<template>
  <section v-if="hasApp" class="sentry-page-app">
    <h3 class="sentry-page-app__title">app</h3>

    <TableBase>
      <TableBaseRow v-if="app.type" title="App type">
        {{ app.type }}
      </TableBaseRow>

      <TableBaseRow v-if="app.app_build" title="App Build">
        {{ app.app_build }}
      </TableBaseRow>

      <TableBaseRow v-if="app.app_identifier" title="Build ID">
        {{ app.app_identifier }}
      </TableBaseRow>

      <TableBaseRow v-if="app.app_id" title="ID">
        {{ app.app_id }}
      </TableBaseRow>

      <TableBaseRow v-if="app.app_name" title="Build Name">
        {{ app.app_name }}
      </TableBaseRow>

      <TableBaseRow v-if="app.app_version" title="Version">
        {{ app.app_version }}
      </TableBaseRow>

      <TableBaseRow v-if="app.permissions" title="Permissions">
        <CodeSnippet class="mt-3" language="json" :code="app.permissions" />
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Sentry } from "~/config/types";
import { TableBaseRow, TableBase, CodeSnippet } from "~/src/shared/ui";

export default defineComponent({
  components: {
    CodeSnippet,
    TableBase,
    TableBaseRow,
  },
  props: {
    event: {
      type: Object as PropType<Sentry>,
      required: true,
    },
  },
  computed: {
    hasApp() {
      return this.event.contexts?.app !== undefined;
    },
    app() {
      return this.event.contexts.app;
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.sentry-page-app {
  @apply py-5 px-4;
}

.sentry-page-app__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
