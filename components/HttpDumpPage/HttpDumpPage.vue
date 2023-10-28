<template>
  <div ref="main" class="http-dump-page">
    <main class="http-dump-page__main">
      <h2 class="http-dump-page__title">
        <span class="http-dump-page__title-method">{{
          event.payload.request.method
        }}</span
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
          <SmtpAttachment
            v-for="a in event.payload.request.files"
            :key="a.id"
            :event="event"
            :attachment="a"
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

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { NormalizedEvent } from "~/config/types";
import { TableBase, TableBaseRow } from "~/src/shared/ui";
import SmtpAttachment from "~/components/SmtpAttachment/SmtpAttachment.vue";

export default defineComponent({
  components: {
    TableBase,
    TableBaseRow,
    SmtpAttachment,
  },
  props: {
    event: {
      type: Object as PropType<NormalizedEvent>,
      required: true,
    },
  },
  data() {
    return {};
  },
  computed: {
    uri() {
      return decodeURI(this.event.payload.request.uri);
    },
    hasPostData(): boolean {
      return (
        this.event.payload.request.post &&
        Object.keys(this.event.payload.request.post).length > 0
      );
    },

    hasQuery(): boolean {
      return (
        this.event.payload.request.query &&
        Object.keys(this.event.payload.request.query).length > 0
      );
    },

    hasHeaders(): boolean {
      return Object.keys(this.event.payload.request.headers).length > 0;
    },

    hasCookies(): boolean {
      return Object.keys(this.event.payload.request.cookies).length > 0;
    },

    hasBody(): boolean {
      return (
        this.event.payload.request.body &&
        this.event.payload.request.body.length > 0
      );
    },

    hasAttachments(): boolean {
      return Object.keys(this.event.payload.request.files).length > 0;
    },
  },
});
</script>

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
