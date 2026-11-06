<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAppBadge } from '@/shared/lib/use-app-badge'
import { useEventsStore } from '@/shared/stores'

const { initialize } = useEventsStore()

initialize()

let stopAppBadge = () => {}

onMounted(() => {
  stopAppBadge = useAppBadge().start()
})

onBeforeUnmount(() => stopAppBadge())
</script>

<template>
  <RouterView />
</template>
