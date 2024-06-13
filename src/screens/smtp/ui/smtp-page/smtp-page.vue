<script lang="ts" setup>
import moment from "moment";
import { computed, ref } from "vue";
import { Tab, Tabs } from "vue3-tabs-component";
import type { SMTP, Attachment } from "~/src/entities/smtp/types";
import type { NormalizedEvent } from "~/src/shared/types";
import {
  TableBase,
  TableBaseRow,
  CodeSnippet,
  FileAttachment,
} from "~/src/shared/ui";
import { SmtpPageAddresses } from "../smtp-page-addresses";
import { SmtpPagePreview } from "../smtp-page-preview";

type Props = {
  event: NormalizedEvent<SMTP>;
  attachments: Attachment[];
  htmlSource: string;
};

const props = withDefaults(defineProps<Props>(), {
  attachments: () => [],
});

const htmlSource = ref(props.htmlSource || props.event.payload.html);

const senders = computed(() => [
  {
    title: "From",
    address: props.event.payload.from,
  },
  {
    title: "To",
    address: props.event.payload.to,
  },
  {
    title: "CC",
    address: props.event.payload.cc,
  },
  {
    title: "BCC",
    address: props.event.payload.bcc,
  },
  {
    title: "Reply to",
    address: props.event.payload.reply_to,
  },
]);

const isHtml = computed(
  () =>
    props.event.payload?.html !== undefined && props.event.payload?.html !== ""
);

const isText = computed(
  () =>
    props.event.payload?.text !== undefined && props.event.payload?.text !== ""
);

const mail = computed(() => props.event.payload);

const date = computed(() =>
  moment(props.event.date).format("DD.MM.YYYY HH:mm:ss")
);
</script>

<template>
  <div ref="main" class="smtp-page">
    <main class="smtp-page__main">
      <header class="smtp-page__header">
        <h2 class="smtp-page__header-title">{{ mail.subject }}</h2>
        <div class="smtp-page__header-meta">
          <span class="smtp-page__header-date">{{ date }}</span>
        </div>
      </header>

      <section class="smtp-page__sender">
        <template v-for="sender in senders">
          <div
            v-for="email in sender.address"
            :key="`${sender.title}-${email.email}`"
            class="smtp-page__sender-item"
            :class="`smtp-page__sender-${sender.title.toLowerCase()}`"
          >
            <div class="smtp-page__sender-title">{{ sender.title }}</div>
            <div class="smtp-page__sender-address">
              <template v-if="email.name">
                {{ email.name }} [{{ email.email }}]
              </template>
              <template v-else>
                {{ email.email }}
              </template>
            </div>
          </div>
        </template>
      </section>

      <section class="smtp-page__body">
        <Tabs :options="{ useUrlFragment: false }">
          <Tab
            v-if="isHtml"
            id="html-preview"
            name="Preview"
            suffix="<span class='smtp-page__body-tab-badge'>HTML</span>"
          >
            <SmtpPagePreview device="tablet">
              <div v-html="htmlSource" />
            </SmtpPagePreview>
          </Tab>
          <Tab v-if="isHtml" name="HTML">
            <CodeSnippet
              language="html"
              class="tab-preview-code"
              :code="event.payload.html"
            />
          </Tab>
          <Tab v-if="isText" name="Text">
            <CodeSnippet
              language="html"
              class="max-w-full tab-preview-code"
              :code="event.payload.text"
            />
          </Tab>
          <Tab
            v-if="attachments.length"
            :name="`Attachments (${attachments.length})`"
          >
            <section class="mb-5">
              <div class="flex gap-x-3">
                <template v-for="a in attachments" :key="a.uuid">
                  <FileAttachment
                    :event-id="event.id"
                    :event="event"
                    :attachment="a"
                  />
                </template>
              </div>
            </section>
          </Tab>
          <Tab name="Raw">
            <CodeSnippet
              class="tab-preview-code"
              language="html"
              :code="event.payload.raw"
            />
          </Tab>
          <Tab name="Tech Info">
            <section>
              <h3 class="mb-3 font-bold">Email Headers</h3>
              <TableBase>
                <TableBaseRow title="Id">
                  {{ event.payload.id }}
                </TableBaseRow>
                <TableBaseRow title="Subject">
                  {{ event.payload.subject }}
                </TableBaseRow>
                <TableBaseRow title="From">
                  <SmtpPageAddresses :addresses="event.payload.from" />
                </TableBaseRow>
                <TableBaseRow title="To">
                  <SmtpPageAddresses :addresses="event.payload.to" />
                </TableBaseRow>
                <TableBaseRow v-if="event.payload.cc.length" title="Cc">
                  <SmtpPageAddresses :addresses="event.payload.cc" />
                </TableBaseRow>
                <TableBaseRow v-if="event.payload.bcc.length" title="Bcc">
                  <SmtpPageAddresses :addresses="event.payload.bcc" />
                </TableBaseRow>
                <TableBaseRow
                  v-if="event.payload.reply_to.length"
                  title="Reply to"
                >
                  <SmtpPageAddresses :addresses="event.payload.reply_to" />
                </TableBaseRow>
              </TableBase>
            </section>
          </Tab>
        </Tabs>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.tab-preview-code {
  @apply max-w-full border dark:border-gray-500 rounded-md overflow-hidden;
}

.smtp-page {
  @apply relative flex-1 flex flex-col h-full;
}

.smtp-page__main {
  @apply flex-1 flex flex-col h-full flex-grow py-5 px-5;
}

.smtp-page__header {
  @apply flex flex-col md:flex-row justify-between gap-y-2;
}

.smtp-page__header-meta {
  @apply flex flex-row items-center gap-x-5 mb-5;
}

.smtp-page__header-title {
  @apply text-lg lg:text-2xl;
}

.smtp-page__header-date {
  @include text-muted;
  @apply text-xs md:text-sm font-semibold;
}

.smtp-page__sender {
  @apply text-xs sm:text-sm font-semibold mt-3 flex flex-wrap items-center;
}

.smtp-page__sender-item {
  @apply flex border border-purple-300 rounded items-center mr-3 mb-2;
}

.smtp-page__sender-title {
  @apply px-2 md:px-3 py-1 border-r font-bold;
}

.smtp-page__sender-address {
  @apply px-2 md:px-3 bg-gray-800 py-1 text-white font-semibold rounded-r;
}

.smtp-page__sender-from .smtp-page__sender-address {
  @apply bg-blue-800;
}

.smtp-page__sender-to .smtp-page__sender-address {
  @apply bg-red-800;
}

.smtp-page__sender-cc .smtp-page__sender-address {
  @apply bg-purple-800;
}

.smtp-page__sender-reply .smtp-page__sender-address {
  @apply bg-green-800;
}

.smtp-page__body {
  @apply flex-1 flex flex-col;

  .tabs-component {
    @apply flex-1 flex flex-col;
  }

  .tabs-component-panel {
    @apply flex-1 flex flex-col;
  }
}

.smtp-page__body-tab-badge {
  @apply bg-red-800 ml-2 text-2xs px-2 py-1 rounded text-white uppercase;
}
</style>
