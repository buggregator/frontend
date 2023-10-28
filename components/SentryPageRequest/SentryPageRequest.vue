<template>
  <section v-if="hasRequest" class="sentry-page-request">
    <h3 class="sentry-page-request__title">request</h3>

    <h3 class="sentry-page-request__url">
      <strong>{{ event.request.method || "GET" }}:</strong>
      {{ event.request.url }}
    </h3>

    <h3 class="sentry-page-request__title sentry-page-request__title--sub">
      headers
    </h3>

    <TableBase>
      <TableBaseRow
        v-for="(value, title) in headers"
        :key="title"
        :title="title"
      >
        {{ Array.isArray(value) ? value[0] || value : value }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Sentry } from "~/config/types";
import { TableBase, TableBaseRow } from "~/src/shared/ui";

export default defineComponent({
  components: {
    TableBaseRow,
    TableBase,
  },
  props: {
    event: {
      type: Object as PropType<Sentry>,
      required: true,
    },
  },
  computed: {
    hasRequest() {
      return this.event.request !== undefined;
    },
    headers() {
      return this.event.request.headers || {};
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.sentry-page-request {
}

.sentry-page-request__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page-request__title--sub {
  @apply mt-7;
}

.sentry-page-request__url {
  @apply mb-1 text-lg font-medium;
}
</style>
