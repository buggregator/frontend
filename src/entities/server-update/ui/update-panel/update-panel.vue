<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { reasonParts } from '../../lib/reason-text'
import { renderReleaseNotes } from '../../lib/release-notes'
import { toUpdateView } from '../../lib/update-view'
import type { UpdateStatus } from '../../types'
import { UpdateCommands } from '../update-commands'
import { UpdateIcon } from '../update-icon'
import { UpdateSteps } from '../update-steps'

// Settings › About & updates: the server version and everything about
// updating it. Shows what the status says; the page passes the actions on.
type Props = {
  status: UpdateStatus
  // The server version this tab loaded with.
  loadedVersion: string
  checking?: boolean
  checkMessage?: string
  starting?: boolean
  actionError?: string
  restartGaveUp?: boolean
  // For «2 h ago» and the check countdown; the page ticks it.
  now?: number
  // The server version from /api/settings, for a status without one.
  fallbackVersion?: string
  // Until then (ms) the server refuses another check.
  checkAvailableAt?: number
}

const props = withDefaults(defineProps<Props>(), {
  checking: false,
  checkMessage: '',
  starting: false,
  actionError: '',
  restartGaveUp: false,
  now: () => Date.now(),
  fallbackVersion: '',
  checkAvailableAt: 0
})

const emit = defineEmits<{
  check: []
  start: [version: string]
  reload: []
}>()

const view = computed(() =>
  toUpdateView({
    status: props.status,
    loadedVersion: props.loadedVersion,
    checking: props.checking,
    now: props.now,
    fallbackVersion: props.fallbackVersion
  })
)

const offReason = computed(() => reasonParts(view.value.offReason))
const manualText = computed(() => reasonParts(view.value.manual?.text))

// Seconds until the server takes another check; 0 = now.
const checkWait = computed(() =>
  Math.max(0, Math.ceil((props.checkAvailableAt - props.now) / 1000))
)

const requestCheck = () => {
  if (checkWait.value === 0) emit('check')
}

const notesHtml = computed(() => renderReleaseNotes(props.status.notes))

const logCopied = ref(false)
watch(
  () => props.status.state.log,
  () => {
    logCopied.value = false
  }
)

const copyLog = async () => {
  try {
    await copyTextToClipboard(view.value.log)
    logCopied.value = true
  } catch (e) {
    console.error('Copy failed', e)
  }
}

const offReasonId = `upd-off-${Math.random().toString(36).slice(2, 8)}`

const hasMiddle = computed(() => {
  const v = view.value
  return !!(
    props.actionError ||
    v.memoryWarning ||
    v.hint ||
    v.manual ||
    v.offReason ||
    v.progress ||
    v.failure ||
    v.rollback ||
    v.kind === 'restart_required' ||
    v.kind === 'done'
  )
})
</script>

<template>
  <div
    class="upd"
    data-test="update-panel"
  >
    <div class="upd__top">
      <div class="upd__head">
        <div class="upd__label">
          Server
        </div>
        <div class="upd__ver">
          <span
            class="upd__now"
            data-test="update-version"
          >v{{ view.version }}</span>
          <span
            class="upd__badge"
            :class="`upd__badge--${view.badge.tone}`"
            role="status"
            data-test="update-badge"
          >
            <span
              v-if="view.badge.icon === 'spinner'"
              class="upd__spinner upd__spinner--sm"
              aria-hidden="true"
            />
            <UpdateIcon
              v-else
              :name="view.badge.icon"
              class="upd__badge-icon"
            />
            {{ view.badge.text }}
          </span>
        </div>
        <div
          v-if="view.meta || view.canCheck"
          class="upd__meta"
        >
          <span v-if="view.meta">{{ view.meta }}</span>
          <template v-if="view.canCheck">
            <span
              v-if="view.meta"
              aria-hidden="true"
            >·</span>
            <span
              v-if="checking"
              class="upd__checking"
              data-test="update-checking"
            ><span
              class="upd__spinner upd__spinner--sm"
              aria-hidden="true"
            />Checking…</span>
            <button
              v-else
              type="button"
              class="upd__link-btn"
              :class="{ 'upd__link-btn--waiting': checkWait > 0 }"
              :aria-disabled="checkWait > 0 ? 'true' : undefined"
              data-test="update-check"
              @click="requestCheck"
            >
              {{ checkWait > 0 ? `Check now (${checkWait} s)` : 'Check now' }}
            </button>
          </template>
        </div>
        <p
          v-if="checkMessage"
          class="upd__check-message"
          role="status"
          data-test="update-check-message"
        >
          {{ checkMessage }}
        </p>
      </div>

      <div
        class="upd__actions"
        :class="{ 'upd__actions--manual': view.manual }"
        data-test="update-actions"
      >
        <template
          v-for="action in view.actions"
          :key="action.kind"
        >
          <a
            v-if="action.kind === 'release-notes'"
            class="upd__btn upd__btn--ghost"
            :href="action.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            Release notes<span class="sr-only"> (opens in a new tab)</span>
            <UpdateIcon name="external" />
          </a>
          <button
            v-else-if="action.kind === 'update'"
            type="button"
            class="upd__btn"
            :class="action.danger ? 'upd__btn--danger' : 'upd__btn--primary'"
            data-test="update-start"
            :disabled="starting"
            :aria-busy="starting ? 'true' : undefined"
            @click="emit('start', action.version)"
          >
            {{ action.label }}
          </button>
          <button
            v-else-if="action.kind === 'locked'"
            type="button"
            class="upd__btn upd__btn--primary upd__btn--locked"
            aria-disabled="true"
            title="Updating from here is off"
            :aria-describedby="offReasonId"
            data-test="update-locked"
          >
            <UpdateIcon name="lock" />
            {{ action.label }}
          </button>
          <button
            v-else-if="action.kind === 'retry'"
            type="button"
            class="upd__btn"
            :class="action.danger ? 'upd__btn--danger' : 'upd__btn--primary'"
            data-test="update-retry"
            :disabled="starting"
            @click="emit('start', action.version)"
          >
            <UpdateIcon name="refresh" />
            Try again
          </button>
          <button
            v-else-if="action.kind === 'copy-log'"
            type="button"
            class="upd__btn upd__btn--ghost"
            data-test="update-copy-log"
            @click="copyLog"
          >
            <UpdateIcon :name="logCopied ? 'check' : 'copy'" />
            {{ logCopied ? 'Log copied' : 'Copy log' }}
          </button>
          <a
            v-else-if="action.kind === 'report'"
            class="upd__btn upd__btn--primary"
            :href="action.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report the problem<span class="sr-only"> (opens in a new tab)</span>
            <UpdateIcon name="external" />
          </a>
        </template>
      </div>
      <span
        class="sr-only"
        aria-live="polite"
      >{{ logCopied ? 'Log copied' : '' }}</span>
    </div>

    <div
      v-if="hasMiddle"
      class="upd__mid"
    >
      <div
        v-if="actionError"
        class="upd__callout upd__callout--danger"
        role="alert"
        data-test="update-action-error"
      >
        <UpdateIcon
          name="alert"
          class="upd__callout-icon"
        />
        <span>{{ actionError }}</span>
      </div>

      <div
        v-if="view.memoryWarning"
        class="upd__callout upd__callout--danger"
        data-test="update-memory-warning"
      >
        <UpdateIcon
          name="alert"
          class="upd__callout-icon"
        />
        <span><b>Updating deletes all events.</b> The database is in memory (<code>:memory:</code>) and
          the update restarts the server. Use a database file to keep events across updates.</span>
      </div>

      <p
        v-if="view.hint"
        class="upd__hint"
      >
        {{ view.hint }}
      </p>

      <div
        v-if="view.manual"
        class="upd__manual"
      >
        <p
          class="upd__text"
          data-test="update-manual-text"
        >
          <template
            v-for="(part, index) in manualText"
            :key="index"
          >
            <code v-if="part.code">{{ part.text }}</code><template v-else>
              {{ part.text }}
            </template>
          </template>
        </p>
        <UpdateCommands
          v-if="view.manual.commands.length"
          :commands="view.manual.commands"
        />
        <a
          v-if="status.url"
          class="upd__manual-notes"
          :href="status.url"
          target="_blank"
          rel="noopener noreferrer"
          data-test="update-manual-notes"
        >Release notes<span class="sr-only"> (opens in a new tab)</span></a>
      </div>

      <div
        v-if="view.offReason"
        :id="offReasonId"
        class="upd__callout upd__callout--info"
        data-test="update-off-reason"
      >
        <UpdateIcon
          name="lock"
          class="upd__callout-icon"
        />
        <span><template
          v-for="(part, index) in offReason"
          :key="index"
        ><code v-if="part.code">{{ part.text }}</code><template v-else>{{ part.text }}</template></template></span>
      </div>

      <div
        v-if="view.progress"
        class="upd__progress"
      >
        <div>
          <div class="upd__line">
            {{ view.progress.line }}
          </div>
          <div
            class="upd__bar"
            :class="{ 'upd__bar--indeterminate': view.progress.percent === null }"
            role="progressbar"
            aria-label="Update progress"
            :aria-valuemin="view.progress.percent === null ? undefined : 0"
            :aria-valuemax="view.progress.percent === null ? undefined : 100"
            :aria-valuenow="view.progress.percent ?? undefined"
          >
            <i :style="{ width: `${view.progress.percent ?? 30}%` }" />
          </div>

          <div
            v-if="restartGaveUp"
            class="upd__callout upd__callout--danger upd__gap"
            role="alert"
            data-test="update-gave-up"
          >
            <UpdateIcon
              name="alert"
              class="upd__callout-icon"
            />
            <span class="upd__callout-body">
              <span><b>The server has not answered for 90 seconds.</b> Check the window or the log
                where Buggregator runs; if it stopped, start it again. Then reload this page.</span>
              <button
                type="button"
                class="upd__btn upd__btn--ghost"
                @click="emit('reload')"
              >
                <UpdateIcon name="refresh" />
                Reload
              </button>
            </span>
          </div>
          <div
            v-else-if="view.progress.restarting"
            class="upd__callout upd__callout--info upd__gap"
          >
            <UpdateIcon
              name="plug"
              class="upd__callout-icon"
            />
            <span>The server is away for a few seconds; events sent now are not received. This page
              reloads by itself when {{ view.target }} answers.</span>
          </div>
          <p
            v-else
            class="upd__hint upd__gap"
          >
            You can leave this page; the update goes on in the server.
          </p>
        </div>
        <UpdateSteps :steps="view.steps" />
      </div>

      <div
        v-if="view.failure"
        class="upd__progress"
      >
        <div
          class="upd__callout upd__callout--danger"
          role="alert"
          data-test="update-failure"
        >
          <UpdateIcon
            name="x"
            class="upd__callout-icon"
          />
          <span><b>{{ view.failure.step || 'The update' }} failed.</b>
            <template v-if="view.failure.error">
              Error: <code>{{ view.failure.error }}</code>.</template>
            Nothing was changed; {{ view.failure.previous }} keeps running.</span>
        </div>
        <UpdateSteps :steps="view.steps" />
      </div>

      <div
        v-if="view.rollback"
        class="upd__progress"
      >
        <div
          class="upd__callout upd__callout--warn"
          role="alert"
          data-test="update-rollback"
        >
          <UpdateIcon
            name="undo"
            class="upd__callout-icon"
          />
          <span><b>{{ view.rollback.target }} did not start, {{ view.rollback.previous }} is back.</b>
            <template v-if="view.rollback.error">
              Error: <code>{{ view.rollback.error }}</code>.</template>
            {{
              status.memory_db
                ? 'The restarts deleted all events: the database is in memory.'
                : 'Your events are kept.'
            }}
            «Copy log» copies what {{ view.rollback.target }} printed, for a report.</span>
        </div>
        <UpdateSteps :steps="view.steps" />
      </div>

      <div
        v-if="view.kind === 'restart_required'"
        class="upd__callout upd__callout--warn"
        role="status"
        data-test="update-restart-required"
      >
        <UpdateIcon
          name="terminal"
          class="upd__callout-icon"
        />
        <div>
          <b>{{ view.target }} is installed — restart it yourself.</b>
          Buggregator runs in a console window, so it cannot restart itself.
          {{ view.previous }} runs until then.
          <template v-if="status.memory_db">
            Restarting deletes all events: the database is in memory.
          </template>
          <ol class="upd__how">
            <li>Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the window where Buggregator runs.</li>
            <li>Start it again the same way.</li>
          </ol>
        </div>
      </div>

      <div
        v-if="view.kind === 'done'"
        class="upd__callout upd__callout--ok"
        role="status"
        data-test="update-done"
      >
        <UpdateIcon
          name="check"
          class="upd__callout-icon"
        />
        <span><b>Updated to {{ view.version }}.</b> {{ view.previous }} is kept as a backup until the
          next update.
          {{
            status.memory_db ? 'The restart deleted all events: the database is in memory.' : ''
          }}</span>
      </div>
    </div>

    <section
      v-if="view.notesTitle"
      class="upd__notes"
      data-test="update-notes"
      :aria-label="view.notesTitle"
    >
      <h3 class="upd__notes-title">
        {{ view.notesTitle }}
      </h3>
      <!-- Built from escaped text by renderReleaseNotes: no markup of the release body survives. -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="notesHtml"
        class="upd__notes-body"
        v-html="notesHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
      <p
        v-if="status.url"
        class="upd__notes-link"
      >
        <a
          :href="status.url"
          target="_blank"
          rel="noopener noreferrer"
        >Full release notes on GitHub<span class="sr-only"> (opens in a new tab)</span></a>
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/server-update/ui/update-buttons' as b;

.upd {
  @apply rounded-md border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;
}

.upd__top {
  @apply grid gap-4 items-center px-4 py-4 sm:px-[18px];
  grid-template-columns: minmax(0, 1fr) auto;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.upd__label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.upd__ver {
  @apply flex flex-wrap items-baseline gap-2.5;
}

.upd__now {
  @apply font-mono text-[22px] font-medium;
}

.upd__badge {
  @apply inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-medium self-center;
}

.upd__badge-icon {
  @apply w-3.5 h-3.5;
}

.upd__badge--ok {
  @apply text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10;
}

.upd__badge--new {
  @apply text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10;
}

.upd__badge--bad {
  @apply text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10;
}

.upd__badge--warn {
  @apply text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10;
}

.upd__badge--muted {
  @apply text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700;
}

.upd__meta {
  @apply flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400;
}

.upd__checking {
  @apply inline-flex items-center gap-1.5;
}

.upd__link-btn {
  @apply text-xs underline underline-offset-2 text-blue-700 dark:text-blue-400 rounded-sm;
  @apply hover:text-blue-900 dark:hover:text-blue-300;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;

  // 44 px touch target on phones without moving the text.
  @media (max-width: 639px) {
    @apply py-[15px] px-1.5 -my-[15px] -mx-1.5;
  }
}

.upd__link-btn--waiting {
  @apply no-underline text-gray-500 dark:text-gray-400 cursor-not-allowed;
}

.upd__check-message {
  @apply mt-1 text-xs text-amber-700 dark:text-amber-400;
}

.upd__actions {
  @apply flex flex-wrap items-center justify-end gap-2;

  @media (max-width: 767px) {
    @apply justify-stretch;

    & > * {
      @apply flex-1;
    }
  }

  &:empty {
    @apply hidden;
  }
}

// Phones, manual mode: the commands come first, the notes link after them.
.upd__actions--manual {
  @media (max-width: 639px) {
    @apply hidden;
  }
}

.upd__manual-notes {
  @apply hidden mt-1 text-[13px] underline underline-offset-2 text-blue-700 dark:text-blue-400;

  @media (max-width: 639px) {
    @apply inline-block py-3;
  }
}

.upd__btn {
  @include b.btn;

  &:disabled {
    @include b.btn-disabled;
  }
}

.upd__btn--primary {
  @include b.btn-primary;
}

.upd__btn--danger {
  @include b.btn-danger;
}

.upd__btn--ghost {
  @include b.btn-ghost;
}

.upd__btn--locked {
  @include b.btn-disabled;
  @apply hover:bg-blue-600;
}

.upd__mid {
  @apply flex flex-col gap-3 px-4 pb-4 sm:px-[18px];
}

.upd__hint {
  @apply m-0 text-xs text-gray-500 dark:text-gray-400;
}

.upd__text {
  @apply m-0 mb-2.5 text-[13px];

  code {
    @apply font-mono text-xs px-1 rounded bg-black/5 dark:bg-white/10 break-words;
  }
}

.upd__gap {
  @apply mt-3;
}

.upd__callout {
  @apply flex items-start gap-2.5 px-3 py-2.5 rounded-md border text-[13px] leading-snug;

  b {
    @apply font-semibold;
  }

  code,
  kbd {
    @apply font-mono text-xs px-1 rounded bg-black/5 dark:bg-white/10;
  }
}

.upd__callout-icon {
  @apply mt-0.5;
}

.upd__callout-body {
  @apply flex flex-col items-start gap-2;
}

.upd__callout--danger {
  @apply bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-400/40;

  .upd__callout-icon {
    @apply text-red-700 dark:text-red-400;
  }
}

.upd__callout--warn {
  @apply bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/40;

  .upd__callout-icon {
    @apply text-amber-700 dark:text-amber-400;
  }
}

.upd__callout--ok {
  @apply bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-400/40;

  .upd__callout-icon {
    @apply text-green-700 dark:text-green-400;
  }
}

.upd__callout--info {
  @apply bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-400/30;

  .upd__callout-icon {
    @apply text-blue-700 dark:text-blue-400;
  }
}

.upd__how {
  @apply mt-1.5 mb-0 pl-5 list-decimal;

  li {
    @apply my-0.5;
  }
}

.upd__progress {
  @apply grid gap-6 items-start;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

  @media (max-width: 767px) {
    @apply gap-3;
    grid-template-columns: minmax(0, 1fr);
  }
}

.upd__line {
  @apply mb-2 text-sm font-medium;
}

.upd__bar {
  @apply h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700;

  i {
    @apply block h-full rounded-full bg-blue-600 dark:bg-blue-400;
    transition: width 0.3s;
  }
}

.upd__bar--indeterminate i {
  animation: upd-indeterminate 1.2s ease-in-out infinite;
}

.upd__spinner {
  @apply inline-block flex-none rounded-full border-2 border-current;
  border-top-color: transparent;
  width: 14px;
  height: 14px;
  animation: upd-spin 0.9s linear infinite;
}

.upd__spinner--sm {
  width: 10px;
  height: 10px;
  border-width: 1.5px;
}

.upd__notes {
  @apply border-t border-gray-200 dark:border-gray-700 px-4 pt-3.5 pb-4 sm:px-[18px];
}

.upd__notes-title {
  @apply m-0 mb-2.5 text-sm font-semibold;
}

.upd__notes-body {
  @apply text-[13px] leading-normal text-gray-700 dark:text-gray-300;

  :deep(h4) {
    @apply mt-3 mb-1 text-2xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400;
  }

  :deep(h4:first-child) {
    @apply mt-0;
  }

  :deep(ul) {
    @apply m-0 pl-[18px] list-disc;
  }

  :deep(li) {
    @apply my-0.5;
  }

  :deep(p) {
    @apply my-1.5;
  }

  :deep(b) {
    @apply font-medium text-gray-900 dark:text-gray-100;
  }

  :deep(code) {
    @apply font-mono text-xs;
  }

  :deep(a) {
    @apply underline underline-offset-2 text-blue-700 dark:text-blue-400;
  }
}

.upd__notes-link {
  @apply mt-2.5 mb-0 text-[13px];

  a {
    @apply underline underline-offset-2 text-blue-700 dark:text-blue-400;
    @apply hover:text-blue-900 dark:hover:text-blue-300;
  }
}

a,
button {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;
}

@keyframes upd-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes upd-indeterminate {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(340%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .upd__spinner,
  .upd__bar--indeterminate i {
    animation: none;
  }

  .upd__bar i {
    transition: none;
  }
}
</style>
