<script lang="ts" setup>
import { PageHeader, PageLayout } from '@/widgets/ui'
import { PAGE_TYPES } from '@/shared/constants'
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.PROFILER" title="Profiler" />
    </template>

    <PageLayout :type="PAGE_TYPES.PROFILER" title="Profiler" />
  </NuxtLayout>
</template>
