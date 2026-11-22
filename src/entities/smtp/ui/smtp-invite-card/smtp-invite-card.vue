<script lang="ts" setup>
import { computed } from 'vue'
import {
  attendeeStatusLabel,
  formatInviteWhen,
  inviteState,
  inviteStateLabel,
  personLabel,
  repeatLabel,
} from '../../lib/smtp-parts'
import type { SMTPCalendar } from '../../types'

// The invite of an email (#6829, option B): what, when (in the viewer's
// zone when the sender's zone is known), where, who; a cancelled one is marked.
type Props = {
  calendar: SMTPCalendar
}

const props = defineProps<Props>()

const state = computed(() => inviteState(props.calendar))
const when = computed(() => formatInviteWhen(props.calendar))
const repeats = computed(() => repeatLabel(props.calendar.rrule))
const attendees = computed(() => props.calendar.attendees ?? [])
const isLink = (value?: string) => !!value && /^https?:\/\//i.test(value)
</script>

<template>
  <section
    class="smtp-invite"
    :class="`smtp-invite--${state}`"
    aria-labelledby="smtp-invite-title"
  >
    <header class="smtp-invite__head">
      <span class="smtp-invite__state">{{ inviteStateLabel[state] }}</span>
      <span
        v-if="calendar.method"
        class="smtp-invite__method"
      >{{ calendar.method }}</span>
    </header>

    <div class="smtp-invite__body">
      <h3
        id="smtp-invite-title"
        class="smtp-invite__summary"
      >
        {{ calendar.summary || '(no title)' }}
      </h3>

      <dl class="smtp-invite__rows">
        <div
          v-if="when"
          class="smtp-invite__row"
        >
          <dt>When</dt>
          <dd data-test="invite-when">
            {{ when }}
            <span
              v-if="repeats"
              class="smtp-invite__muted"
            ><br>{{ repeats }}</span>
          </dd>
        </div>

        <div
          v-if="calendar.location"
          class="smtp-invite__row"
        >
          <dt>Where</dt>
          <dd>
            <a
              v-if="isLink(calendar.location)"
              :href="calendar.location"
              target="_blank"
              rel="noopener noreferrer"
              class="smtp-invite__link"
            >{{ calendar.location }}</a>
            <template v-else>
              {{ calendar.location }}
            </template>
          </dd>
        </div>

        <div
          v-if="calendar.organizer && personLabel(calendar.organizer)"
          class="smtp-invite__row"
        >
          <dt>Organizer</dt>
          <dd class="smtp-invite__mono">
            {{ personLabel(calendar.organizer) }}
          </dd>
        </div>

        <div
          v-if="attendees.length"
          class="smtp-invite__row"
        >
          <dt>Guests <span class="smtp-invite__muted">{{ attendees.length }}</span></dt>
          <dd>
            <ul class="smtp-invite__guests">
              <li
                v-for="(guest, i) in attendees"
                :key="guest.email || i"
                class="smtp-invite__guest"
              >
                <span class="smtp-invite__mono">{{ personLabel(guest) }}</span>
                <span
                  v-if="guest.status"
                  class="smtp-invite__rsvp"
                  :class="`smtp-invite__rsvp--${guest.status.toLowerCase()}`"
                >{{ attendeeStatusLabel(guest.status) }}</span>
              </li>
            </ul>
          </dd>
        </div>

        <div
          v-if="calendar.url"
          class="smtp-invite__row"
        >
          <dt>Link</dt>
          <dd>
            <a
              :href="calendar.url"
              target="_blank"
              rel="noopener noreferrer"
              class="smtp-invite__link"
            >{{ calendar.url }}</a>
          </dd>
        </div>
      </dl>

      <p
        v-if="calendar.description"
        class="smtp-invite__description"
      >
        {{ calendar.description }}
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.smtp-invite {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.smtp-invite__head {
  @apply flex items-center gap-2 px-4 py-2.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.smtp-invite__state {
  @apply text-xs font-semibold uppercase tracking-wider;
  @apply text-blue-700 dark:text-blue-300;

  .smtp-invite--cancelled & {
    @apply text-red-700 dark:text-red-400;
  }
}

.smtp-invite__method {
  @apply ml-auto text-2xs font-mono px-1.5 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.smtp-invite__body {
  @apply px-4 py-3;
}

.smtp-invite__summary {
  @apply text-base font-semibold mb-2;

  .smtp-invite--cancelled & {
    @apply line-through text-gray-500 dark:text-gray-400;
  }
}

.smtp-invite__rows {
  @apply flex flex-col gap-1.5 text-sm;
}

.smtp-invite__row {
  @apply flex flex-col sm:flex-row gap-0.5 sm:gap-3;

  dt {
    @apply text-xs font-medium text-gray-500 dark:text-gray-400 sm:w-24 flex-shrink-0 sm:pt-0.5;
  }

  dd {
    @apply min-w-0 break-words;
  }
}

.smtp-invite__muted {
  @apply text-gray-500 dark:text-gray-400;
}

.smtp-invite__mono {
  @apply font-mono text-xs;
}

.smtp-invite__link {
  @apply text-blue-600 dark:text-blue-400 hover:underline break-all;
}

.smtp-invite__guests {
  @apply flex flex-col gap-1;
}

.smtp-invite__guest {
  @apply flex flex-wrap items-center gap-2;
}

.smtp-invite__rsvp {
  @apply text-2xs font-medium px-1.5 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.smtp-invite__rsvp--accepted {
  @apply bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400;
}

.smtp-invite__rsvp--declined {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.smtp-invite__rsvp--tentative {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400;
}

.smtp-invite__description {
  @apply mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50;
  @apply text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words;
  @apply max-h-48 overflow-y-auto;
}
</style>
