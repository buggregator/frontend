<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAppBadge } from '@/shared/lib/use-app-badge'
import { useEventsStore, useProfileStore } from '@/shared/stores'

const { initialize } = useEventsStore()
const { token } = storeToRefs(useProfileStore())

// The auth middleware of the first navigation loads the stored token; asking
// for the projects before it ends sends no token (401 with auth on). A login
// changes the token: the projects are asked for again.
useRouter()
  .isReady()
  .then(() => {
    initialize()
    watch(token, (value) => value && initialize())
  })

let stopAppBadge = () => {}

onMounted(() => {
  stopAppBadge = useAppBadge().start()
})

onBeforeUnmount(() => stopAppBadge())
</script>

<template>
  <RouterView />
</template>
