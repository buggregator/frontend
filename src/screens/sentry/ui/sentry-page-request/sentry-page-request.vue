<script lang="ts" setup>
import { SentryRequest } from "~/src/entities/sentry/types";
import { TableBase, TableBaseRow } from "~/src/shared/ui";

type Props = {
  request: SentryRequest;
};

defineProps<Props>();

const normalizeHeaderValue = (value: unknown) =>
  Array.isArray(value) ? value[0] || value : value;
</script>

<template>
  <section class="sentry-page-request">
    <h3 class="sentry-page-request__title">request</h3>

    <h3 v-if="request" class="sentry-page-request__url">
      <strong>{{ request.method || "GET" }}:</strong>
      {{ request.url }}
    </h3>

    <h3 class="sentry-page-request__title sentry-page-request__title--sub">
      headers
    </h3>

    <TableBase v-if="request && request.headers">
      <TableBaseRow
        v-for="(value, title) in request.headers"
        :key="title"
        :title="title"
      >
        {{ normalizeHeaderValue(value) }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

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
