<script lang="ts" setup>
import { defineProps, computed } from "vue";
import { HttpDump } from "~/src/entities/http-dump/types";
import { NormalizedEvent } from "~/src/shared/types";
import { TableBase, TableBaseRow, FileAttachment } from "~/src/shared/ui";

type Props = {
  event: NormalizedEvent<HttpDump>;
};

const props = defineProps<Props>();

const uri = computed(() => decodeURI(props.event.payload?.request?.uri));

const hasPostData = computed(
  () =>
    props.event.payload?.request?.post &&
    Object.keys(props.event.payload?.request?.post).length > 0
);

const hasQuery = computed(
  () =>
    props.event.payload?.request?.query &&
    Object.keys(props.event.payload?.request?.query).length > 0
);

const hasHeaders = computed(
  () => Object.keys(props.event.payload?.request?.headers || {}).length > 0
);

const hasCookies = computed(
  () =>
    props.event.payload?.request?.cookies &&
    Object.keys(props.event.payload?.request?.cookies).length > 0
);

const hasBody = computed(() => props.event.payload?.request?.body?.length > 0);

const hasAttachments = computed(
  () =>
    props.event.payload?.request?.files &&
    Object.keys(props.event.payload?.request?.files).length > 0
);
</script>

<template>
  <div ref="main" class="http-dump-page">
    <main class="http-dump-page__main">
      <h2 class="http-dump-page__title">
        <span class="http-dump-page__title-method">
          {{ event.payload.request.method }} </span
        >: <span class="http-dump-page__title-uri">/{{ uri }}</span>
      </h2>

      <section v-if="hasHeaders" class="http-dump-page__section">
        <h1>Headers</h1>
        <TableBase>
          <TableBaseRow
            v-for="(value, title) in event.payload.request.headers"
            :key="title"
            :title="String(title)"
          >
            {{ value[0] || value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section v-if="hasCookies" class="http-dump-page__section">
        <h1>Cookie</h1>
        <TableBase>
          <TableBaseRow
            v-for="(value, title) in event.payload.request.cookies"
            :key="title"
            :title="String(title)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section v-if="hasQuery" class="http-dump-page__section">
        <h1>Query Parameters</h1>
        <TableBase>
          <TableBaseRow
            v-for="(value, title) in event.payload.request.query"
            :key="title"
            :title="String(title)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section v-if="hasPostData" class="http-dump-page__section">
        <h1>POST Data</h1>
        <TableBase>
          <TableBaseRow
            v-for="(value, title) in event.payload.request.post"
            :key="title"
            :title="String(title)"
          >
            {{ value }}
          </TableBaseRow>
        </TableBase>
      </section>

      <section v-if="hasAttachments" class="http-dump-page__section">
        <h1>Attachments ({{ event.payload.request.files.length }})</h1>

        <div class="http-dump-page__attachments">
          <FileAttachment
            v-for="file in event.payload.request.files"
            :key="file.id"
            :event-id="event.id"
            :attachment="file"
          />
        </div>
      </section>

      <section v-if="hasBody" class="http-dump-page__section">
        <h1>Request Body</h1>
        <code class="http-dump-page__section-body">
          {{ event.payload.request.body }}
        </code>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.http-dump-page {
  @apply relative flex-1 flex flex-col;
}

.http-dump-page__main {
  @apply flex-1 flex flex-col h-full gap-y-10 py-5 px-4 md:px-6 lg:px-8;
}

.http-dump-page__title {
  @apply text-2xl;
}

.http-dump-page__title-method {
  @apply font-mono;
}

.http-dump-page__title-uri {
  @apply font-mono font-bold;
}

.http-dump-page__section {
  @apply flex-1;
}

.http-dump-page__section h1 {
  @apply mb-3 text-xl font-bold;
}

.http-dump-page__attachments {
  @apply flex gap-x-3;
}

.http-dump-page__section-body {
  @apply border p-3;

  word-wrap: break-word;
  display: block;
}
</style>
