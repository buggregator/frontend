<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'

useTitle('Sentry | Buggregator')
</script>

<template>
  <LayoutBase>
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <RouterView />
  </LayoutBase>
</template>
