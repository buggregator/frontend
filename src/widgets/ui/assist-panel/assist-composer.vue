<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import type { AssistState } from './use-assist-thread'

// The question box: grows with the text (38 → 160 px), Enter sends,
// Shift+Enter breaks the line. Typing stays allowed while not connected;
// only sending is off, and the button says why.

type Props = {
  state: AssistState
  sending: boolean
  placeholder: string
  showKeys: boolean
}

const props = defineProps<Props>()
const draft = defineModel<string>({ required: true })
const emit = defineEmits<{ send: [text: string] }>()

const box = ref<HTMLTextAreaElement | null>(null)
const connected = computed(() => props.state === 'connected')
const canSend = computed(() => connected.value && !props.sending && !!draft.value.trim())
const sendTitle = computed(() => (connected.value ? 'Send' : 'Not connected'))

const grow = () => {
  const el = box.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(160, Math.max(38, el.scrollHeight))}px`
}
watch(draft, () => nextTick(grow))

const submit = () => {
  if (!canSend.value) return
  emit('send', draft.value)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    submit()
  }
}

defineExpose({ focus: () => box.value?.focus() })
</script>

<template>
  <form
    class="ap-compose"
    @submit.prevent="submit"
  >
    <div
      class="ap-compose__box"
      :class="{ 'ap-compose__box--off': !connected }"
    >
      <label
        for="ap-question"
        class="sr-only"
      >Your question</label>
      <textarea
        id="ap-question"
        ref="box"
        v-model="draft"
        class="ap-compose__input"
        rows="1"
        :placeholder="placeholder"
        @keydown="onKeydown"
      />
      <button
        type="submit"
        class="ap-compose__send"
        :disabled="!canSend"
        :aria-busy="sending ? 'true' : undefined"
        :title="sendTitle"
        :aria-label="sendTitle"
      >
        <span
          v-if="sending"
          class="ap-spin ap-spin--light"
          aria-hidden="true"
        />
        <svg
          v-else
          viewBox="0 0 16 16"
          aria-hidden="true"
        ><path d="M8 13V3m0 0L3.5 7.5M8 3l4.5 4.5" /></svg>
      </button>
    </div>
    <p
      v-if="showKeys"
      class="ap-compose__keys"
    >
      <span><kbd>Enter</kbd> send · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line</span>
      <span><kbd>Esc</kbd> close</span>
    </p>
  </form>
</template>
