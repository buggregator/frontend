<script lang="ts" setup>
// eslint-disable-next-line @conarti/feature-sliced/public-api
import { PageLayout } from "~/src/widgets/ui/page-layout";
import { PAGE_TYPES } from "~/src/shared/constants";
</script>

<template>
  <PageLayout :type="PAGE_TYPES.ALL_EVENTS" title="" />
</template>
