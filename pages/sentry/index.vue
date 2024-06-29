<script lang="ts" setup>
import { PageHeader, PageLayout } from "~/src/widgets/ui";
import { PAGE_TYPES } from "~/src/shared/constants";
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageHeader :type="PAGE_TYPES.SENTRY" title="Sentry" />
    </template>

    <PageLayout :type="PAGE_TYPES.SENTRY" title="Sentry" />
  </NuxtLayout>
</template>
