<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { SkeletonLoader, TableBase, TableBaseRow } from '@/shared/ui'
import { relayAddress, relaySender, useSmtpRelay } from '../../lib/smtp-relay'
import SmtpRelaySetup from './smtp-relay-setup.vue'

// Settings › Email relay (#6605): what the server's outgoing SMTP relay is set
// to, read-only. The relay lives in the server config; the password never
// reaches the browser.
const { info, state, load } = useSmtpRelay()
onMounted(() => load())

const status = computed(() => {
  if (!info.value) return ''
  if (info.value.enabled) return 'On'
  return info.value.configured ? 'Off' : 'Not set up'
})

const rows = computed(() => {
  const i = info.value
  if (!i?.configured) return []
  return [
    { label: 'Server', value: relayAddress(i) },
    { label: 'From', value: i.from || relaySender(i).replace(/^./, (c) => c.toUpperCase()) },
    {
      label: 'Allowed recipients',
      value: i.allowed_recipients?.length ? i.allowed_recipients.join(', ') : 'Any address'
    },
    { label: 'At most', value: `${i.max_recipients || 20} addresses per send` },
    ...(i.local_only
      ? [{ label: 'Works from', value: 'Run directly on this machine, opened on localhost (auth is off; not in Docker)' }]
      : [])
  ]
})
</script>

<template>
  <div
    class="relay-status"
    data-test="smtp-relay-status"
  >
    <div
      v-if="state === 'loading' || state === 'idle'"
      role="status"
      aria-label="Loading the email relay"
      data-test="smtp-relay-loading"
    >
      <SkeletonLoader variant="text" />
    </div>
    <p
      v-else-if="state === 'unavailable' || !info"
      class="relay-status__text"
      data-test="smtp-relay-unavailable"
    >
      This server cannot send email out. Update Buggregator to use the relay.
    </p>
    <template v-else>
      <p class="relay-status__line">
        <span
          class="relay-status__pill"
          :class="info.enabled ? 'relay-status__pill--on' : 'relay-status__pill--off'"
          data-test="smtp-relay-pill"
        >{{ status }}</span>
        <span
          v-if="info.enabled"
          class="relay-status__text"
        >«Send to inbox» on an email page sends it out.</span>
      </p>
      <p
        v-if="info.configured && !info.enabled && info.reason"
        class="relay-status__reason"
        data-test="smtp-relay-reason"
      >
        {{ info.reason }}
      </p>
      <TableBase
        v-if="rows.length"
        data-test="smtp-relay-rows"
      >
        <TableBaseRow
          v-for="row in rows"
          :key="row.label"
          :title="row.label"
        >
          {{ row.value }}
        </TableBaseRow>
      </TableBase>
      <SmtpRelaySetup
        v-if="!info.enabled"
        :info="info"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.relay-status {
  @apply flex flex-col gap-2 mt-2;
}

.relay-status__line {
  @apply flex flex-wrap items-center gap-2;
}

.relay-status__text {
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.relay-status__pill {
  @apply text-2xs font-semibold uppercase px-2 py-0.5 rounded;
}

.relay-status__pill--on {
  @apply bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400;
}

.relay-status__pill--off {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
}

.relay-status__reason {
  @apply text-xs p-2 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300;
}
</style>
