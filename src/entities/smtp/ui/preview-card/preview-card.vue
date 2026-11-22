<script lang="ts" setup>
import { computed } from 'vue'
import { previewText } from '@/shared/lib/formats'
import type { NormalizedEvent } from '@/shared/types'
import { AddressFlow, PreviewCard } from '@/shared/ui'
import { formatInviteWhen, inviteState, listBadges } from '../../lib/smtp-parts'
import type { SMTP } from '../../types'

type Props = {
  event: NormalizedEvent<SMTP>
}

const props = defineProps<Props>()
const eventLink = computed(() => `/smtp/${props.event.id}`)

const emailFrom = computed(() => {
  const from = props.event?.payload?.from?.[0]
  if (!from) return null
  return from.name ? `${from.name} <${from.email}>` : from.email
})

const emailTo = computed(() => {
  const to = props.event?.payload?.to?.[0]
  if (!to) return null
  return to.name ? `${to.name} <${to.email}>` : to.email
})

const textPreview = computed(() => previewText(props.event?.payload?.text))

const hasHtml = computed(() => !!props.event?.payload?.html)

// #6829: «Watch», «AMP», «Invite» / «Cancelled», and the invite in one line.
const badges = computed(() => listBadges(props.event?.payload ?? {}))
const invite = computed(() => {
  const calendar = props.event?.payload?.calendar
  if (!calendar) return null
  const when = formatInviteWhen(calendar)
  return {
    cancelled: inviteState(calendar) === 'cancelled',
    text: [calendar.summary, when].filter(Boolean).join(' · '),
  }
})
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="smtp-body"
    >
      <div class="smtp-body__header">
        <h2 class="smtp-body__subject">
          {{ event.payload.subject }}
        </h2>
        <span class="smtp-body__badges">
          <span
            v-for="badge in badges"
            :key="badge"
            class="smtp-body__badge smtp-body__badge--part"
            data-test="smtp-list-badge"
          >{{ badge }}</span>
          <span
            v-if="hasHtml"
            class="smtp-body__badge"
          >HTML</span>
        </span>
      </div>

      <AddressFlow
        class="smtp-body__flow"
        :from="emailFrom"
        :to="emailTo"
      />

      <p
        v-if="invite"
        class="smtp-body__invite"
        :class="{ 'smtp-body__invite--cancelled': invite.cancelled }"
        data-test="smtp-list-invite"
      >
        {{ invite.text }}
      </p>

      <p
        v-if="textPreview"
        class="smtp-body__preview"
      >
        {{ textPreview }}
      </p>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.smtp-body {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.smtp-body__header {
  @apply flex items-start justify-between gap-2 mb-1.5;
}

.smtp-body__subject {
  @apply font-medium text-sm;
}

.smtp-body__badge {
  @apply text-2xs font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0;
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400;
}

.smtp-body__badges {
  @apply flex flex-wrap justify-end gap-1 flex-shrink-0;
}

.smtp-body__badge--part {
  @apply bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300;
}

.smtp-body__invite {
  @apply text-xs font-medium mb-1 text-blue-700 dark:text-blue-300;
}

.smtp-body__invite--cancelled {
  @apply line-through text-gray-500 dark:text-gray-400;
}

.smtp-body__flow {
  @apply mb-1.5;
}

.smtp-body__preview {
  @apply text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2;
}
</style>
