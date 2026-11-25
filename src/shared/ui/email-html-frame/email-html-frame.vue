<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  EMAIL_FRAME_HEAD,
  EMAIL_FRAME_SANDBOX,
  FRAME_FIT_SCRIPT,
  FRAME_HEIGHT_KEY,
  PAGE_FRAME_SANDBOX,
  withHead
} from './constants'

type Props = {
  html: string
  title?: string
  // The sender's own scripts run (opaque origin: no app page, login or storage).
  scripts?: boolean
  // With scripts: the frame takes the page's height, no scrollbar inside.
  fit?: boolean
  // With fit: the least height (CSS length), e.g. the room left on the page.
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Email HTML preview',
  scripts: false,
  fit: false,
  minHeight: '0'
})

// Captured HTML is untrusted: the sandbox gives the frame an opaque origin with
// forms and top navigation blocked (scripts too, unless `scripts`), so it
// cannot read the app's page or localStorage (JWT); the API refuses its
// Origin: null (see PAGE_FRAME_SANDBOX).
// Links open in a new tab via <base target>.
const fits = computed(() => props.scripts && props.fit)
const sandbox = computed(() => (props.scripts ? PAGE_FRAME_SANDBOX : EMAIL_FRAME_SANDBOX))
const srcdoc = computed(() => {
  if (!props.scripts) return EMAIL_FRAME_HEAD + props.html
  const page = withHead(props.html, '<base target="_blank">')
  return fits.value ? page + FRAME_FIT_SCRIPT : page
})

const MIN_HEIGHT = 40
const MAX_HEIGHT = 100_000
const frame = ref<HTMLIFrameElement | null>(null)
const height = ref<number | null>(null)

// Only the frame's own window may set its height; any number is clamped.
const onMessage = (e: MessageEvent) => {
  if (!fits.value || !frame.value || e.source !== frame.value.contentWindow) return
  const h = (e.data as Record<string, unknown> | null)?.[FRAME_HEIGHT_KEY]
  if (typeof h !== 'number' || !Number.isFinite(h)) return
  height.value = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(h)))
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))

const style = computed(() =>
  fits.value ? { height: `${height.value ?? 150}px`, minHeight: props.minHeight } : undefined
)

</script>

<template>
  <iframe
    ref="frame"
    :srcdoc="srcdoc"
    :title="title"
    :sandbox="sandbox"
    :style="style"
    :scrolling="fits ? 'no' : undefined"
    referrerpolicy="no-referrer"
  />
</template>
