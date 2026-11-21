<script lang="ts" setup>
import { computed } from 'vue'
import { CodeSnippet } from '@/shared/ui'
import type { SmtpRelayInfo } from '../../lib/smtp-relay'

// How to turn release on, for the dialog and Settings: the config lines that
// are missing. The values are examples; the password goes in a file or env.
type Props = { info: SmtpRelayInfo }

const props = defineProps<Props>()

const needsAllowList = computed(() => props.info.configured && !props.info.enabled)

const yaml = computed(() =>
  needsAllowList.value
    ? 'smtp_relay:\n  allowed_recipients: ["me@example.com", "*@mycompany.com"]'
    : 'smtp_relay:\n  host: smtp.gmail.com\n  port: 587\n  tls: starttls\n  username: me@gmail.com\n  password_file: /run/secrets/smtp_password\n  allowed_recipients: ["me@gmail.com"]'
)

const env = computed(() =>
  needsAllowList.value
    ? 'SMTP_RELAY_ALLOWED_RECIPIENTS=me@example.com'
    : 'SMTP_RELAY_HOST=smtp.gmail.com\nSMTP_RELAY_USERNAME=me@gmail.com\nSMTP_RELAY_PASSWORD=app-password\nSMTP_RELAY_ALLOWED_RECIPIENTS=me@gmail.com'
)
</script>

<template>
  <div
    class="relay-setup"
    data-test="smtp-relay-setup"
  >
    <p class="relay-setup__text">
      <template v-if="needsAllowList">
        Name the addresses Buggregator may send to:
      </template>
      <template v-else>
        Buggregator needs an outgoing SMTP server (your mail provider, or Mailpit for a test). In
        <code>buggregator.yaml</code>:
      </template>
    </p>
    <CodeSnippet
      :code="yaml"
      language="yaml"
    />
    <p class="relay-setup__text">
      Or as environment variables:
    </p>
    <CodeSnippet
      :code="env"
      language="bash"
    />
    <p class="relay-setup__text">
      Then restart Buggregator. Without auth, sending works only to the allowed addresses, and only
      when Buggregator runs directly on this machine and you open it on localhost. In Docker or
      behind a proxy, turn auth on.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.relay-setup {
  @apply flex flex-col gap-2;
}

.relay-setup__text {
  @apply text-sm text-gray-700 dark:text-gray-300;

  code {
    @apply font-mono text-xs;
  }
}
</style>
