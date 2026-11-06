<script lang="ts" setup>
import { computed } from 'vue'
import { EMAIL_FRAME_HEAD, EMAIL_FRAME_SANDBOX } from './constants'

type Props = {
  html: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Email HTML preview'
})

// Captured HTML is untrusted: the sandbox gives the frame an opaque origin with
// scripts, forms and top navigation blocked, so it cannot reach the app's
// localStorage (JWT) or API. Links open in a new tab via <base target>.
const srcdoc = computed(() => EMAIL_FRAME_HEAD + props.html)
</script>

<template>
  <iframe
    :srcdoc="srcdoc"
    :title="title"
    :sandbox="EMAIL_FRAME_SANDBOX"
    referrerpolicy="no-referrer"
  />
</template>
