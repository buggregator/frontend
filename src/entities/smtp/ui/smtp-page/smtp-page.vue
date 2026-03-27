<script lang="ts" setup>
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import { htmlEncode } from '@/shared/lib/helpers'
import { useAttachments } from '@/shared/lib/io'
import type { NormalizedEvent, Attachment } from '@/shared/types'
import {
  CodeSnippet,
  FileAttachment,
  EmailPreviewDevice,
  EmailPreview,
  EventDetailLayout,
  EventDetailSection,
  PageTabs,
  PageTab
} from '@/shared/ui'
import type { SMTP } from '../../types'

type Props = {
  event: NormalizedEvent<SMTP>
}

const props = defineProps<Props>()
const attachments = ref<Attachment[]>([])

const { getAttachments, calcDownloadLink } = useAttachments()

const iframeStyle = '<style>html,body{height:100%;margin:0}</style>'

const htmlSource = computed(() =>
  props.event?.payload?.html
    ? `<iframe srcdoc="${htmlEncode(iframeStyle + props.event?.payload?.html)}" title="Email HTML preview"/>`
    : undefined
)

const getAttachmentsRequest = async () => {
  try {
    const result = await getAttachments(props.event.id)
    attachments.value = result
  } catch (error) {
    console.error(error)
  }
}

const senders = computed(() => [
  { title: 'From', address: props.event.payload.from },
  { title: 'To', address: props.event.payload.to },
  { title: 'CC', address: props.event.payload.cc },
  { title: 'BCC', address: props.event.payload.bcc },
  { title: 'Reply to', address: props.event.payload.reply_to }
])

const isHtml = computed(
  () => props.event.payload?.html !== undefined && props.event.payload?.html !== ''
)

const isText = computed(
  () => props.event.payload?.text !== undefined && props.event.payload?.text !== ''
)

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))

const calcDownloadUrl = (attachmentId: Attachment['uuid']) =>
  calcDownloadLink(props.event.id, attachmentId)

onMounted(getAttachmentsRequest)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div class="smtp-header">
        <h2 class="smtp-header__subject">
          {{ event.payload.subject }}
        </h2>
        <span class="smtp-header__date">{{ date }}</span>
      </div>
    </template>

    <!-- Addresses -->
    <EventDetailSection>
      <div class="smtp-addresses">
        <template
          v-for="sender in senders"
          :key="sender.title"
        >
          <div
            v-for="email in sender.address"
            :key="`${sender.title}-${email.email}`"
            class="smtp-addresses__pill"
          >
            <span class="smtp-addresses__label">{{ sender.title }}</span>
            <span class="smtp-addresses__value">
              <template v-if="email.name">{{ email.name }} &lt;{{ email.email }}&gt;</template>
              <template v-else>{{ email.email }}</template>
            </span>
          </div>
        </template>
      </div>
    </EventDetailSection>

    <!-- Content tabs (outside wrapper, full-width) -->
    <div class="smtp-tabs">
      <PageTabs>
        <PageTab
          v-if="isHtml"
          id="html-preview"
          name="Preview"
        >
          <EmailPreview :device="EmailPreviewDevice.Tablet">
            <div
              class="smtp-preview-frame"
              v-html="htmlSource"
            />
          </EmailPreview>
        </PageTab>
        <PageTab
          v-if="isHtml"
          name="HTML"
        >
          <CodeSnippet
            language="html"
            :code="event.payload.html"
          />
        </PageTab>
        <PageTab
          v-if="isText"
          name="Text"
        >
          <CodeSnippet
            language="plaintext"
            :code="event.payload.text"
          />
        </PageTab>
        <PageTab
          v-if="attachments.length"
          name="Attachments"
          :suffix="`<span class='tab-badge'>${attachments.length}</span>`"
        >
          <div class="smtp-attachments">
            <FileAttachment
              v-for="a in attachments"
              :key="a.uuid"
              :event-id="event.id"
              :attachment="a"
              :download-url="calcDownloadUrl(a.uuid)"
            />
          </div>
        </PageTab>
        <PageTab name="Raw">
          <CodeSnippet
            language="plaintext"
            :code="event.payload.raw"
          />
        </PageTab>
        <PageTab name="Tech Info">
          <div class="tech-info">
            <!-- Summary boxes -->
            <div class="tech-info__boxes">
              <div class="tech-info__box">
                <span class="tech-info__box-label">Message ID</span>
                <span class="tech-info__box-value">{{ event.payload.id }}</span>
              </div>
              <div class="tech-info__box">
                <span class="tech-info__box-label">Subject</span>
                <span class="tech-info__box-value">{{ event.payload.subject }}</span>
              </div>
              <div
                v-if="date"
                class="tech-info__box"
              >
                <span class="tech-info__box-label">Date</span>
                <span class="tech-info__box-value">{{ date }}</span>
              </div>
            </div>

            <!-- Address groups -->
            <div class="tech-info__section">
              <h4 class="tech-info__section-title">
                Addresses
              </h4>

              <div class="tech-info__addr-groups">
                <template
                  v-for="sender in senders"
                  :key="sender.title"
                >
                  <div
                    v-if="sender.address?.length"
                    class="tech-info__addr-group"
                  >
                    <span class="tech-info__addr-label">{{ sender.title }}</span>
                    <div class="tech-info__addr-list">
                      <div
                        v-for="email in sender.address"
                        :key="email.email"
                        class="tech-info__addr-item"
                      >
                        <span
                          v-if="email.name"
                          class="tech-info__addr-name"
                        >{{ email.name }}</span>
                        <span class="tech-info__addr-email">{{ email.email }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </PageTab>
      </PageTabs>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Preview iframe wrapper */
.smtp-preview-frame {
  @apply w-full h-full;
}

/* Header */
.smtp-header__subject {
  @apply text-base md:text-lg lg:text-xl font-semibold mb-1;
}

.smtp-header__date {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400;
}

/* Addresses */
.smtp-addresses {
  @apply flex flex-wrap gap-1.5;
}

.smtp-addresses__pill {
  @apply inline-flex items-center text-xs rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.smtp-addresses__label {
  @apply px-2 py-1 text-gray-500 dark:text-gray-400 font-medium;
  @apply bg-gray-50 dark:bg-gray-800;
}

.smtp-addresses__value {
  @apply px-2 py-1 font-mono;
  @apply bg-white dark:bg-gray-900;
}

/* Tabs — full-width, outside section wrapper */
.smtp-tabs {
  @apply flex-1 flex flex-col overflow-hidden;
  @apply -mx-5 md:-mx-6 lg:-mx-8;

  :deep(.tabs-component) {
    @apply flex-1 flex flex-col;
  }

  :deep(.tabs-component-tabs) {
    @apply px-5 md:px-6 lg:px-8;
    @apply bg-gray-50 dark:bg-gray-900;
  }

  :deep(.tabs-component-panels) {
    @apply mt-0 flex-1;
  }

  :deep(.tabs-component-panel) {
    @apply flex-1 flex flex-col px-5 md:px-6 lg:px-8 py-4;
  }
}

/* Attachments */
.smtp-attachments {
  @apply flex flex-wrap gap-3;
}

/* Tech Info */
.tech-info {
  @apply flex flex-col gap-5;
}

.tech-info__boxes {
  @apply flex flex-col sm:flex-row gap-2;
}

.tech-info__box {
  @apply flex flex-col flex-1 p-3 rounded;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.tech-info__box-label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.tech-info__box-value {
  @apply text-xs font-mono mt-1 break-all;
}

.tech-info__section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}

.tech-info__addr-groups {
  @apply flex flex-col gap-3;
}

.tech-info__addr-group {
  @apply flex flex-col sm:flex-row sm:items-start gap-2;
}

.tech-info__addr-label {
  @apply text-xs font-medium text-gray-500 dark:text-gray-400;
  @apply sm:w-20 flex-shrink-0 sm:pt-1.5;
}

.tech-info__addr-list {
  @apply flex flex-col gap-1 flex-1;
}

.tech-info__addr-item {
  @apply flex items-center gap-2 px-3 py-1.5 rounded;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply text-xs;
}

.tech-info__addr-name {
  @apply font-medium;
}

.tech-info__addr-email {
  @apply font-mono text-gray-500 dark:text-gray-400;
}
</style>
