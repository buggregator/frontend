<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import {
  ReleaseError,
  getStoredRecipients,
  parseRecipients,
  relayAddress,
  setStoredRecipients,
  useSmtpRelay
} from '../../lib/smtp-relay'
import SmtpRelaySetup from './smtp-relay-setup.vue'

// «Send to inbox» on a caught email (#6605): the server's outgoing SMTP relay
// delivers it to a real mailbox, to see it on a phone or in a real client.
type Props = { eventId: string }

const props = defineProps<Props>()

const { info, state, load, release } = useSmtpRelay()
onMounted(() => load())

const uid = useId()
const dialog = ref<HTMLDialogElement | null>(null)
const opener = ref<HTMLButtonElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

const recipients = ref(getStoredRecipients())
const rewriteTo = ref(false)
const sending = ref(false)
const sentTo = ref<string[]>([])
const error = ref('')

const parsed = computed(() => parseRecipients(recipients.value))
const max = computed(() => info.value?.max_recipients || 20)
const tooMany = computed(() => parsed.value.valid.length > max.value)
const canSend = computed(
  () =>
    !!info.value?.enabled &&
    !sending.value &&
    parsed.value.valid.length > 0 &&
    parsed.value.invalid.length === 0 &&
    !tooMany.value
)
const allowed = computed(() => info.value?.allowed_recipients ?? [])

const open = async () => {
  sentTo.value = []
  error.value = ''
  dialog.value?.showModal()
  await nextTick()
  ;(input.value ?? dialog.value?.querySelector<HTMLElement>('button'))?.focus()
}

const close = () => dialog.value?.close()

// Focus back on the button that opened it (Esc, Close or Cancel).
const onClosed = () => opener.value?.focus()

const send = async () => {
  if (!canSend.value) return
  sending.value = true
  error.value = ''
  sentTo.value = []
  try {
    sentTo.value = await release(props.eventId, parsed.value.valid, rewriteTo.value)
    setStoredRecipients(parsed.value.valid.join(', '))
  } catch (e) {
    error.value = e instanceof ReleaseError ? e.message : 'Sending failed.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div
    v-if="state === 'ready' && info"
    class="smtp-release"
  >
    <button
      ref="opener"
      type="button"
      class="smtp-release__open"
      :class="{ 'smtp-release__open--off': !info.enabled }"
      :aria-describedby="info.enabled ? undefined : `${uid}-off`"
      data-test="smtp-release-open"
      @click="open"
    >
      Send to inbox
    </button>
    <span
      v-if="!info.enabled"
      :id="`${uid}-off`"
      class="smtp-release__off"
    >{{ info.configured ? 'Relay is off' : 'Relay not set up' }}</span>

    <dialog
      ref="dialog"
      class="smtp-release__dialog"
      :aria-labelledby="`${uid}-title`"
      data-test="smtp-release-dialog"
      @close="onClosed"
    >
      <form
        class="smtp-release__form"
        method="dialog"
        @submit.prevent="send"
      >
        <header class="smtp-release__head">
          <h3
            :id="`${uid}-title`"
            class="smtp-release__title"
          >
            Send to a real inbox
          </h3>
          <button
            type="button"
            class="smtp-release__close"
            aria-label="Close"
            @click="close"
          >
            &times;
          </button>
        </header>

        <!-- Not set up, or set up but off: say why and how. -->
        <template v-if="!info.enabled">
          <p
            v-if="info.configured && info.reason"
            class="smtp-release__reason"
            data-test="smtp-release-reason"
          >
            {{ info.reason }}
          </p>
          <SmtpRelaySetup :info="info" />
        </template>

        <template v-else>
          <p class="smtp-release__via">
            The message goes as caught through
            <strong>{{ relayAddress(info) }}</strong>, from
            <strong>{{ info.from || "the message's own From" }}</strong>.
          </p>

          <label
            :for="`${uid}-to`"
            class="smtp-release__label"
          >To</label>
          <input
            :id="`${uid}-to`"
            ref="input"
            v-model="recipients"
            type="text"
            inputmode="email"
            autocomplete="email"
            class="smtp-release__input"
            placeholder="me@example.com"
            :aria-invalid="parsed.invalid.length > 0 || tooMany"
            :aria-describedby="`${uid}-to-hint`"
            data-test="smtp-release-to"
          >
          <p
            :id="`${uid}-to-hint`"
            class="smtp-release__hint"
            :class="{ 'smtp-release__hint--bad': parsed.invalid.length > 0 || tooMany }"
          >
            <template v-if="parsed.invalid.length">
              Not an address: {{ parsed.invalid.join(', ') }}
            </template>
            <template v-else-if="tooMany">
              At most {{ max }} addresses.
            </template>
            <template v-else>
              Separate several with commas.
              <template v-if="allowed.length">
                The server sends only to {{ allowed.join(', ') }}.
              </template>
            </template>
          </p>

          <label class="smtp-release__check">
            <input
              v-model="rewriteTo"
              type="checkbox"
              data-test="smtp-release-rewrite"
            >
            <span>
              Put these addresses in To
              <span class="smtp-release__check-hint">Replaces To and drops Cc. Off: the headers stay as caught.</span>
            </span>
          </label>

          <p
            v-if="info.local_only"
            class="smtp-release__note"
          >
            Auth is off, so sending works only with Buggregator opened on this machine (localhost).
          </p>

          <p
            v-if="sentTo.length"
            class="smtp-release__ok"
            role="status"
            data-test="smtp-release-ok"
          >
            Sent to {{ sentTo.join(', ') }}. Check the inbox, and the spam folder.
          </p>
          <p
            v-if="error"
            class="smtp-release__error"
            role="alert"
            data-test="smtp-release-error"
          >
            {{ error }}
          </p>
        </template>

        <footer class="smtp-release__foot">
          <button
            type="button"
            class="smtp-release__btn"
            @click="close"
          >
            {{ sentTo.length || !info.enabled ? 'Close' : 'Cancel' }}
          </button>
          <button
            v-if="info.enabled"
            type="submit"
            class="smtp-release__btn smtp-release__btn--primary"
            :disabled="!canSend"
            data-test="smtp-release-send"
          >
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
        </footer>
      </form>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
.smtp-release {
  @apply inline-flex items-center gap-2;
}

.smtp-release__open {
  @apply inline-flex items-center h-7 max-sm:h-11 px-3 rounded text-xs font-medium;
  @apply text-white bg-blue-600 hover:bg-blue-700;
}

.smtp-release__open--off {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
}

.smtp-release__off {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.smtp-release__dialog {
  @apply w-full max-w-lg p-0 rounded-lg;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;
  @apply border border-gray-200 dark:border-gray-700;

  &::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
}

.smtp-release__form {
  @apply flex flex-col gap-3 p-4;
}

.smtp-release__head {
  @apply flex items-center justify-between gap-2;
}

.smtp-release__title {
  @apply text-base font-semibold;
}

.smtp-release__close {
  @apply w-8 h-8 rounded text-lg text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
}

.smtp-release__via,
.smtp-release__reason {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.smtp-release__reason {
  @apply p-2 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300;
}

.smtp-release__label {
  @apply text-xs font-semibold uppercase text-gray-500 dark:text-gray-400;
}

.smtp-release__input {
  @apply w-full h-9 px-2 rounded text-sm;
  @apply bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600;
}

.smtp-release__hint {
  @apply -mt-2 text-xs text-gray-500 dark:text-gray-400;
}

.smtp-release__hint--bad {
  @apply text-red-700 dark:text-red-400;
}

.smtp-release__check {
  @apply flex items-start gap-2 text-sm cursor-pointer;

  input {
    @apply mt-1;
  }
}

.smtp-release__check-hint {
  @apply block text-xs text-gray-500 dark:text-gray-400;
}

.smtp-release__note {
  @apply text-xs text-amber-700 dark:text-amber-300;
}

.smtp-release__ok {
  @apply text-sm text-green-700 dark:text-green-400;
}

.smtp-release__error {
  @apply text-sm text-red-700 dark:text-red-400;
}

.smtp-release__foot {
  @apply flex justify-end gap-2 pt-1;
}

.smtp-release__btn {
  @apply inline-flex items-center h-8 max-sm:h-11 px-3 rounded text-sm font-medium;
  @apply bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600;

  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}

.smtp-release__btn--primary {
  @apply text-white bg-blue-600 hover:bg-blue-700;
}
</style>
