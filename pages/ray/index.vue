<script lang="ts" setup>
import { PageLayout } from "~/src/widgets/ui/page-layout";
import { PAGE_TYPES } from "~/src/shared/constants";
</script>

<template>
  <PageLayout :type="PAGE_TYPES.RAY_DUMP" title="Ray Dumps" />
</template>
