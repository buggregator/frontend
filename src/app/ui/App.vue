<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useEventsStore } from '@/shared/stores'

const { initialize } = useEventsStore()

initialize()
</script>

<template>
  <RouterView />
</template>
