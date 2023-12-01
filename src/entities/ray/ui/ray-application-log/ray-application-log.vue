<script lang="ts" setup>
import { RayContentApplicationLog } from "../../types";

type Props = {
  content: RayContentApplicationLog;
};

defineProps<Props>();
</script>

<template>
  <pre class="ray-application-log">{{ content.value }}</pre>
</template>

<style lang="scss" scoped>
.ray-application-log {
  @apply p-3 border border-gray-300 dark:border-gray-600 bg-gray-800 flex w-full overflow-auto;
}
</style>
