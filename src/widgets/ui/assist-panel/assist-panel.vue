<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  ASSIST_WIDTH,
  assistWidth,
  clampAssistWidth,
  closeAssist,
  currentPageContext,
  assistRecipient,
  isAssistOpen
} from '@/shared/lib/assist'
import { useEvents } from '@/shared/lib/use-events'
import type { AssistSummary } from './assist-api'
import AssistComposer from './assist-composer.vue'
import AssistConversation from './assist-conversation.vue'
import AssistRecent from './assist-recent.vue'
import { placeholderFor, splitTitle, STATUS_TEXT } from './assist-texts'
import { useAssistThread } from './use-assist-thread'

// The agents panel (#7116, design #7113 A): docked on the right of every
// page, 420 px (360–640, dragged or arrow keys, remembered). From 1280 px it
// pushes the page; narrower it lies over it; on a phone it fills the screen.
// It stays open across pages and shows the thread of the page on screen.

const context = currentPageContext
const {
  status,
  state,
  thread,
  threadLoading,
  sending,
  pending,
  error,
  waiting,
  recent,
  send,
  retry,
  loadRecent,
  checkAgain
} = useAssistThread(context, isAssistOpen, computed(() => chosenTo.value))

const isPhone = useMediaQuery('(max-width: 639px)')
const isWide = useMediaQuery('(min-width: 1280px)')
const showKeys = useMediaQuery('(min-width: 640px) and (pointer: fine)')

// Pushing: the layout narrows the page by the panel's width (--ap-push).
const pushes = computed(() => isAssistOpen.value && isWide.value && !isPhone.value)
watchEffect(() => {
  const html = document.documentElement
  html.classList.toggle('assist-push', pushes.value)
  html.style.setProperty('--ap-push', pushes.value ? `${assistWidth.value}px` : '0px')
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('assist-push')
  document.documentElement.style.removeProperty('--ap-push')
})

// One draft per thread context: switching pages keeps what was typed.
const drafts = new Map<string, string>()
const draftKey = computed(() => (context.value ? `${context.value.kind}:${context.value.key}` : ''))
const draft = ref('')
watch(draftKey, (key, old) => {
  if (old !== undefined) drafts.set(old, draft.value)
  draft.value = drafts.get(key) ?? ''
}, { immediate: true })

const composer = ref<InstanceType<typeof AssistComposer> | null>(null)

const ask = async (text: string) => {
  const ok = await send(text)
  if (ok) {
    draft.value = ''
    drafts.delete(draftKey.value)
  }
}
const onSend = (text: string) => {
  // The question moves into the thread at once; on failure it stays there
  // with «Try again» and the box keeps it too.
  ask(text)
}

const chip = computed(() => splitTitle(context.value?.title ?? ''))
const threadOf = computed(() => (context.value?.kind === 'event' ? 'Thread of this event' : 'Thread of this page'))
const projectLine = computed(() => status.value?.project ?? '')
// Who gets the question (#7122). A new thread goes to the pick (the last
// one remembered, if still on the list, else the server's default); a
// thread keeps the recipient it was started with.
const recipients = computed(() => status.value?.recipients ?? [])
const nameOf = (address: string) =>
  recipients.value.find((r) => r.address === address)?.name ?? address.replace(/^role:/, '')
const chosenTo = computed(() => {
  const list = recipients.value
  if (list.some((r) => r.address === assistRecipient.value)) return assistRecipient.value
  return status.value?.default ?? list[0]?.address ?? ''
})
// A new thread always shows the picker, so the person sees where the
// choice lives; with one recipient it is disabled and says where others
// come from.
const showPicker = computed(() => !thread.value && recipients.value.length > 0)
const canPick = computed(() => recipients.value.length > 1)
const pickHint = 'Other recipients are added in harnsy'
const toLine = computed(() => {
  if (thread.value?.to) return nameOf(thread.value.to)
  if (thread.value) return nameOf(status.value?.to ?? '')
  return nameOf(chosenTo.value || status.value?.to || '')
})
const onPick = (e: Event) => {
  assistRecipient.value = (e.target as HTMLSelectElement).value
}

// Width: drag the left edge, or ← → on it.
const dragging = ref(false)
const onGripDown = (e: PointerEvent) => {
  if (isPhone.value || e.button !== 0) return
  e.preventDefault()
  dragging.value = true
  const startX = e.clientX
  const startW = assistWidth.value
  const move = (ev: PointerEvent) => {
    assistWidth.value = clampAssistWidth(startW + (startX - ev.clientX))
  }
  const up = () => {
    dragging.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
const onGripKey = (e: KeyboardEvent) => {
  const d = e.key === 'ArrowLeft' ? ASSIST_WIDTH.step : e.key === 'ArrowRight' ? -ASSIST_WIDTH.step : 0
  if (!d) return
  e.preventDefault()
  assistWidth.value = clampAssistWidth(assistWidth.value + d)
}

// Recent threads.
const recentOpen = ref(false)
const recentLoaded = ref(false)
const recentButton = ref<HTMLButtonElement | null>(null)
const toggleRecent = async () => {
  recentOpen.value = !recentOpen.value
  if (recentOpen.value) {
    recentLoaded.value = false
    await loadRecent()
    recentLoaded.value = true
  }
}
const closeRecent = () => {
  recentOpen.value = false
  recentButton.value?.focus()
}

const router = useRouter()
const { events: eventsApi } = useEvents()
const pick = async (t: AssistSummary) => {
  recentOpen.value = false
  if (t.kind === 'page') {
    await router.push(t.key)
  } else {
    // The event's page depends on its type.
    const ev = await eventsApi.getItem(t.key as never).catch(() => null)
    const type = ev?.type
    await router.push(!type || type === 'sentry' ? `/sentry/event/${t.key}` : `/${type}/${t.key}`)
  }
  composer.value?.focus()
}

// Esc closes (focus goes back to the opener); on a phone the panel is a
// dialog over the page, so Tab stays inside.
const root = ref<HTMLElement | null>(null)
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && !e.defaultPrevented) {
    e.preventDefault()
    e.stopPropagation()
    closeAssist()
    return
  }
  if (e.key === 'Tab' && isPhone.value && root.value) {
    const list = Array.from(
      root.value.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, a[href], summary, [tabindex="0"]')
    ).filter((el) => el.offsetParent !== null)
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

// Kept mounted once opened (v-show): the thread, scroll and drafts survive
// closing. Opening puts focus in the question box.
watch(
  isAssistOpen,
  async (open) => {
    if (!open) {
      recentOpen.value = false
      return
    }
    await nextTick()
    // A phone: focus into the dialog, but no keyboard popping up over it.
    if (isPhone.value) root.value?.focus()
    else composer.value?.focus()
  },
  { immediate: true }
)

const placeholder = computed(() => placeholderFor(context.value))
</script>

<template>
  <aside
    id="assist-panel"
    ref="root"
    class="ap"
    :class="{ 'ap--phone': isPhone, 'ap--over': !isWide && !isPhone, 'ap--drag': dragging }"
    :style="{ '--ap-w': `${assistWidth}px` }"
    :role="isPhone ? 'dialog' : 'complementary'"
    :aria-modal="isPhone ? 'true' : undefined"
    aria-labelledby="ap-heading"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div
      v-if="!isPhone"
      class="ap__grip"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-label="Panel width"
      :aria-valuenow="assistWidth"
      :aria-valuemin="ASSIST_WIDTH.min"
      :aria-valuemax="ASSIST_WIDTH.max"
      @pointerdown="onGripDown"
      @keydown="onGripKey"
    />

    <header class="ap__head">
      <div class="ap__heading">
        <h2
          id="ap-heading"
          class="ap__title"
        >
          Agents
        </h2>
        <p
          class="ap__status"
          :class="`ap__status--${state}`"
          :title="state === 'stopped' ? status?.reason : undefined"
        >
          <template v-if="state === 'connected'">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
            ><path d="M3.5 8.5l3 3 6-7" /></svg>
            <span class="sr-only">Connected:</span>
            <strong>{{ projectLine }}</strong>{{ ' ·' }}
            <label
              v-if="showPicker"
              class="ap__to-pick"
              :title="canPick ? undefined : pickHint"
            >
              <span class="sr-only">Ask</span>
              <select
                class="ap__to-select"
                :value="chosenTo"
                :disabled="!canPick"
                :aria-describedby="canPick ? undefined : 'ap-to-hint'"
                :title="canPick ? 'Who gets the question' : undefined"
                @change="onPick"
              >
                <option
                  v-for="r in recipients"
                  :key="r.address"
                  :value="r.address"
                >{{ r.about ? `${r.name} — ${r.about}` : r.name }}</option>
              </select>
              <span
                v-if="!canPick"
                id="ap-to-hint"
                class="sr-only"
              >{{ pickHint }}</span>
            </label>
            <span
              v-else-if="toLine"
              class="ap__to"
            >{{ toLine }}</span>
          </template>
          <template v-else-if="state === 'connecting'">
            <span
              class="ap-spin"
              aria-hidden="true"
            />Connecting…
          </template>
          <template v-else-if="state === 'stopped'">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
            ><rect
              x="4"
              y="4"
              width="8"
              height="8"
              rx="1"
            /></svg>Stopped
          </template>
          <template v-else-if="state === 'off'">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
            ><path d="M4 8h8" /></svg>Not set up
          </template>
        </p>
      </div>
      <button
        ref="recentButton"
        type="button"
        class="ap__icon"
        :class="{ 'ap__icon--on': recentOpen }"
        aria-label="Recent threads"
        title="Recent threads"
        :aria-expanded="recentOpen ? 'true' : 'false'"
        aria-controls="ap-recent"
        data-ap-recent-toggle
        :disabled="state === 'off'"
        @click="toggleRecent"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
        ><circle
          cx="8"
          cy="8"
          r="5.5"
        /><path d="M8 5v3.2l2 1.3" /></svg>
      </button>
      <button
        type="button"
        class="ap__icon"
        aria-label="Close the agents panel"
        title="Close (Esc)"
        @click="closeAssist()"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
        ><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </button>
      <AssistRecent
        v-if="recentOpen"
        :threads="recent"
        :current-id="thread?.id ?? null"
        :loaded="recentLoaded"
        @pick="pick"
        @close="closeRecent"
      />
    </header>

    <div
      v-if="context && state !== 'off'"
      class="ap__ctx"
    >
      <p class="ap__chip">
        <svg
          class="ap__chip-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            v-if="context.kind === 'event'"
            d="M8 2.5 14 13H2Z M8 6.5v3 M8 11.2v.1"
          />
          <path
            v-else
            d="M2.5 3.5h11v9h-11Z M2.5 6.5h11 M5.5 6.5v6"
          />
        </svg>
        <span
          v-if="chip.kind"
          class="ap__chip-kind"
        >{{ chip.kind }}</span>
        <strong class="ap__chip-subject">{{ chip.subject }}</strong>
      </p>
      <p class="ap__ctx-note">
        {{ threadOf }}
      </p>
    </div>

    <AssistConversation
      :context="context"
      :state="state"
      :status="status"
      :thread="thread"
      :loading="threadLoading"
      :pending="pending"
      :sending="sending"
      :error="error"
      :waiting="waiting"
      @ask="ask"
      @retry="retry"
    />

    <p
      v-if="state === 'connecting'"
      class="ap__note"
      role="status"
    >
      {{ STATUS_TEXT.connecting }}
    </p>
    <p
      v-else-if="state === 'stopped'"
      class="ap__note ap__note--err"
      role="alert"
    >
      {{ STATUS_TEXT.stopped }}
      <button
        type="button"
        class="ap__note-action"
        @click="checkAgain"
      >
        Check again
      </button>
    </p>

    <AssistComposer
      v-if="state !== 'off'"
      ref="composer"
      v-model="draft"
      :state="state"
      :sending="sending"
      :placeholder="placeholder"
      :show-keys="showKeys"
      @send="onSend"
    />
  </aside>
</template>

<style lang="scss" src="./assist-panel.scss"></style>
