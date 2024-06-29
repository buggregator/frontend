<script lang="ts" setup>
import { PageHeader, PageLayout } from "~/src/widgets/ui";
import { PAGE_TYPES } from "~/src/shared/constants";
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.PROFILER" title="Profiler" />
    </template>

    <PageLayout :type="PAGE_TYPES.PROFILER" title="Profiler" />
  </NuxtLayout>
</template>
