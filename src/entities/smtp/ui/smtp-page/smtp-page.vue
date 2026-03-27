<script lang="ts" setup>
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import { htmlEncode } from '@/shared/lib/helpers'
import { useAttachments } from '@/shared/lib/io'
import { logger } from '@/shared/lib/logger'
import type { NormalizedEvent, Attachment } from '@/shared/types'
import {
  CodeSnippet,
  FileAttachment,
  EmailPreviewDevice,
  EmailPreview,
  EventDetailLayout,
  PageTabs,
  PageTab
} from '@/shared/ui'
import { useSmtpAnalytics, type MimeNode } from '../../lib/use-smtp-analytics'
import type { SMTP } from '../../types'
import { SmtpInsights } from '../smtp-insights'

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
    logger.ui.error('Failed to fetch attachments', error)
  }
}

const addressGroups = computed(() => [
  { title: 'From', addresses: props.event.payload.from },
  { title: 'To', addresses: props.event.payload.to },
  { title: 'CC', addresses: props.event.payload.cc },
  { title: 'BCC', addresses: props.event.payload.bcc },
  { title: 'Reply to', addresses: props.event.payload.reply_to }
].filter((g) => g.addresses && g.addresses.length > 0))

const fromSummary = computed(() => {
  const from = props.event.payload.from?.[0]
  return from?.name || from?.email || 'Unknown'
})

const toSummary = computed(() => {
  const to = props.event.payload.to || []
  if (to.length === 0) return ''
  const first = to[0].name || to[0].email
  return to.length > 1 ? `${first} +${to.length - 1}` : first
})

const isHtml = computed(
  () => props.event.payload?.html !== undefined && props.event.payload?.html !== ''
)

const isText = computed(
  () => props.event.payload?.text !== undefined && props.event.payload?.text !== ''
)

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))
const relativeDate = computed(() => moment(props.event.date).fromNow())

const calcDownloadUrl = (attachmentId: Attachment['uuid']) =>
  calcDownloadLink(props.event.id, attachmentId)

// Analytics
const rawRef = computed(() => props.event.payload.raw || '')
const htmlRef = computed(() => props.event.payload.html || '')
const textRef = computed(() => props.event.payload.text || '')
const subjectRef = computed(() => props.event.payload.subject || '')

const { metrics, mimeTree, links, deliverability, contentQa, compatibility, security } =
  useSmtpAnalytics(rawRef, htmlRef, textRef, subjectRef)

const insightGroups = computed(() => [
  { title: 'Deliverability', findings: deliverability.value },
  { title: 'Content QA', findings: contentQa.value },
  { title: 'Compatibility', findings: compatibility.value },
  { title: 'Security', findings: security.value },
])

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const renderMimeTree = (node: MimeNode, depth = 0): string => {
  const indent = '  '.repeat(depth)
  const enc = node.encoding ? ` (${node.encoding})` : ''
  let result = `${indent}${node.contentType}${enc}\n`
  for (const child of node.children) {
    result += renderMimeTree(child, depth + 1)
  }
  return result
}

onMounted(getAttachmentsRequest)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div class="smtp-header">
        <div class="smtp-header__top">
          <h2 class="smtp-header__subject">
            {{ event.payload.subject }}
          </h2>
          <div class="smtp-header__badges">
            <span
              v-if="isHtml && isText"
              class="smtp-header__badge smtp-header__badge--html"
            >Multipart</span>
            <span
              v-else-if="isHtml"
              class="smtp-header__badge smtp-header__badge--html"
            >HTML</span>
            <span
              v-else-if="isText"
              class="smtp-header__badge"
            >Text</span>
            <span
              v-if="attachments.length"
              class="smtp-header__badge"
            >{{ attachments.length }} file{{ attachments.length > 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div class="smtp-header__meta">
          <span class="smtp-header__flow">
            <span class="smtp-header__from">{{ fromSummary }}</span>
            <span class="smtp-header__arrow">&rarr;</span>
            <span class="smtp-header__to">{{ toSummary }}</span>
          </span>
          <span class="smtp-header__date">
            {{ date }}
            <span class="smtp-header__relative">({{ relativeDate }})</span>
          </span>
        </div>
      </div>
    </template>

    <!-- Quick stats bar -->
    <div class="smtp-stats">
      <span class="smtp-stats__item"><span class="smtp-stats__label">Size</span> {{ formatSize(metrics.totalSize) }}</span>
      <span class="smtp-stats__sep" />
      <span class="smtp-stats__item"><span class="smtp-stats__label">Links</span> {{ metrics.linkCount }}</span>
      <span class="smtp-stats__sep" />
      <span class="smtp-stats__item"><span class="smtp-stats__label">Images</span> {{ metrics.imageCount }}</span>
      <span class="smtp-stats__sep" />
      <span class="smtp-stats__item"><span class="smtp-stats__label">Type</span> {{ metrics.contentType }}</span>
      <span
        v-if="metrics.charset !== 'unknown'"
        class="smtp-stats__sep"
      />
      <span
        v-if="metrics.charset !== 'unknown'"
        class="smtp-stats__item"
      ><span class="smtp-stats__label">Charset</span> {{ metrics.charset }}</span>
    </div>

    <!-- Two-column layout: LEFT = info, RIGHT = preview -->
    <div class="smtp-layout">
      <!-- Left: metadata & analytics -->
      <div class="smtp-layout__info">
        <!-- Recipients -->
        <section class="smtp-card">
          <h3 class="smtp-card__title">
            Recipients
          </h3>
          <div class="smtp-addr-groups">
            <div
              v-for="group in addressGroups"
              :key="group.title"
              class="smtp-addr-group"
            >
              <span class="smtp-addr-group__label">{{ group.title }}</span>
              <div class="smtp-addr-group__list">
                <span
                  v-for="email in group.addresses"
                  :key="email.email"
                  class="smtp-addr"
                >
                  <template v-if="email.name">
                    <span class="smtp-addr__name">{{ email.name }}</span>
                    <span class="smtp-addr__email">&lt;{{ email.email }}&gt;</span>
                  </template>
                  <template v-else>
                    <span class="smtp-addr__email">{{ email.email }}</span>
                  </template>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Message Info -->
        <section class="smtp-card">
          <h3 class="smtp-card__title">
            Message Info
          </h3>
          <div class="smtp-info-rows">
            <div class="smtp-info-row">
              <span class="smtp-info-row__label">Message ID</span>
              <span class="smtp-info-row__value">{{ event.payload.id }}</span>
            </div>
            <div class="smtp-info-row">
              <span class="smtp-info-row__label">Date</span>
              <span class="smtp-info-row__value">{{ date }}</span>
            </div>
            <div class="smtp-info-row">
              <span class="smtp-info-row__label">Format</span>
              <span class="smtp-info-row__value">
                {{ isHtml && isText ? 'Multipart (HTML + Text)' : isHtml ? 'HTML only' : 'Plain text' }}
              </span>
            </div>
            <div class="smtp-info-row">
              <span class="smtp-info-row__label">Size</span>
              <span class="smtp-info-row__value">{{ formatSize(metrics.totalSize) }}</span>
            </div>
          </div>
        </section>

        <!-- Attachments -->
        <section
          v-if="attachments.length"
          class="smtp-card"
        >
          <h3 class="smtp-card__title">
            Attachments
            <span class="smtp-card__num">{{ attachments.length }}</span>
          </h3>
          <div class="smtp-card__body">
            <FileAttachment
              v-for="a in attachments"
              :key="a.uuid"
              :event-id="event.id"
              :attachment="a"
              :download-url="calcDownloadUrl(a.uuid)"
            />
          </div>
        </section>

        <!-- Links -->
        <section
          v-if="links.length"
          class="smtp-card"
        >
          <h3 class="smtp-card__title">
            Links
            <span class="smtp-card__num">{{ links.length }}</span>
          </h3>
          <div class="smtp-links">
            <div
              v-for="(link, idx) in links"
              :key="idx"
              class="smtp-link"
              :class="{ 'smtp-link--empty': link.isEmpty }"
            >
              <div class="smtp-link__text">
                {{ link.text }}
              </div>
              <a
                v-if="link.href"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="smtp-link__href"
                :class="{ 'smtp-link__href--http': link.isHttp }"
              >{{ link.href }}</a>
              <span
                v-else
                class="smtp-link__href smtp-link__href--empty"
              >empty href</span>
            </div>
          </div>
        </section>

        <!-- Insights -->
        <section class="smtp-card">
          <h3 class="smtp-card__title">
            Insights
          </h3>
          <SmtpInsights :groups="insightGroups" />
        </section>

        <!-- MIME Structure -->
        <section
          v-if="mimeTree"
          class="smtp-card"
        >
          <h3 class="smtp-card__title">
            MIME Structure
          </h3>
          <pre class="smtp-mime-tree">{{ renderMimeTree(mimeTree) }}</pre>
        </section>
      </div>

      <!-- Right: preview -->
      <div class="smtp-layout__preview">
        <div class="smtp-preview-card">
          <PageTabs>
            <!-- HTML preview (default) -->
            <PageTab
              v-if="isHtml"
              name="HTML Preview"
            >
              <EmailPreview :device="EmailPreviewDevice.Desktop">
                <div
                  class="smtp-preview-frame"
                  v-html="htmlSource"
                />
              </EmailPreview>
            </PageTab>

            <!-- Text -->
            <PageTab
              v-if="isText"
              name="Text"
            >
              <pre class="smtp-text-preview">{{ event.payload.text }}</pre>
            </PageTab>

            <!-- HTML source -->
            <PageTab
              v-if="isHtml"
              name="HTML Source"
            >
              <CodeSnippet
                language="html"
                :code="event.payload.html"
              />
            </PageTab>

            <!-- Raw -->
            <PageTab name="Raw">
              <CodeSnippet
                language="plaintext"
                :code="event.payload.raw"
              />
            </PageTab>
          </PageTabs>
        </div>
      </div>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Header */
.smtp-header__top {
  @apply flex items-start justify-between gap-3 mb-2;
}

.smtp-header__subject {
  @apply text-base md:text-lg lg:text-xl font-semibold;
}

.smtp-header__badges {
  @apply flex gap-1.5 flex-shrink-0;
}

.smtp-header__badge {
  @apply text-2xs font-semibold uppercase px-2 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.smtp-header__badge--html {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400;
}

.smtp-header__meta {
  @apply flex flex-wrap items-center gap-x-4 gap-y-1;
}

.smtp-header__flow {
  @apply flex items-center gap-1.5 text-sm;
}

.smtp-header__from {
  @apply font-medium;
}

.smtp-header__arrow {
  @apply text-gray-400 dark:text-gray-500;
}

.smtp-header__to {
  @apply text-gray-600 dark:text-gray-300;
}

.smtp-header__date {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400;
}

.smtp-header__relative {
  @apply text-gray-400 dark:text-gray-500;
}

/* Quick stats bar */
.smtp-stats {
  @apply flex flex-wrap items-center gap-2;
  @apply px-5 md:px-6 lg:px-8 py-2 -mx-5 md:-mx-6 lg:-mx-8;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700/50;
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400;
}

.smtp-stats__label {
  @apply text-gray-400 dark:text-gray-500 mr-1;
}

.smtp-stats__sep {
  @apply w-px h-3 bg-gray-200 dark:bg-gray-700;
}

/* Two-column layout */
.smtp-layout {
  @apply flex flex-col xl:flex-row gap-5;
}

.smtp-layout__info {
  @apply flex flex-col gap-4;
  @apply xl:w-[38%] xl:flex-shrink-0;
  @apply order-2 xl:order-1;
}

.smtp-layout__preview {
  @apply flex-1 min-w-0;
  @apply order-1 xl:order-2;
}

/* Preview card */
.smtp-preview-card {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;

  :deep(.tabs-component-tabs) {
    @apply px-4;
    @apply bg-gray-50 dark:bg-gray-900;
  }

  :deep(.tabs-component-panel) {
    @apply p-0;
  }
}

.smtp-preview-frame {
  @apply w-full h-full;
}

.smtp-text-preview {
  @apply text-sm font-mono p-4 whitespace-pre-wrap break-words;
  @apply text-gray-700 dark:text-gray-200;
  @apply bg-white dark:bg-gray-800;
  @apply min-h-[300px];
}

/* Cards */
.smtp-card {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.smtp-card__title {
  @apply text-xs font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply px-4 py-2.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply flex items-center gap-2;
}

.smtp-card__num {
  @apply font-normal text-gray-400 dark:text-gray-500;
  @apply ml-0.5;

  &::before {
    content: '·';
    @apply mr-1;
  }
}

.smtp-card__body {
  @apply flex flex-wrap gap-2 p-4;
}

/* Addresses */
.smtp-addr-groups {
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.smtp-addr-group {
  @apply flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3;
  @apply px-4 py-2;
}

.smtp-addr-group__label {
  @apply text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-400 dark:text-gray-500;
  @apply sm:w-16 sm:pt-0.5 flex-shrink-0;
}

.smtp-addr-group__list {
  @apply flex flex-wrap gap-1.5;
}

.smtp-addr {
  @apply inline-flex items-center gap-1 text-xs;
}

.smtp-addr__name {
  @apply font-medium;
}

.smtp-addr__email {
  @apply font-mono text-gray-500 dark:text-gray-400;
}

/* Info rows */
.smtp-info-rows {
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.smtp-info-row {
  @apply flex items-start gap-3 px-4 py-2;
  @apply text-xs;
}

.smtp-info-row__label {
  @apply font-medium text-gray-400 dark:text-gray-500;
  @apply w-24 flex-shrink-0;
}

.smtp-info-row__value {
  @apply font-mono break-all;
}

/* Links */
.smtp-links {
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.smtp-link {
  @apply px-4 py-2;
}

.smtp-link--empty {
  @apply bg-amber-50/50 dark:bg-amber-500/5;
}

.smtp-link__text {
  @apply text-xs font-medium truncate;
}

.smtp-link__href {
  @apply text-2xs font-mono truncate block;
  @apply text-blue-500 dark:text-blue-400 hover:underline;
}

.smtp-link__href--http {
  @apply text-amber-600 dark:text-amber-400;
}

.smtp-link__href--empty {
  @apply text-red-500 dark:text-red-400 italic;
}

/* MIME tree */
.smtp-mime-tree {
  @apply text-2xs font-mono p-3;
  @apply text-gray-600 dark:text-gray-300;
  @apply whitespace-pre;
}
</style>
