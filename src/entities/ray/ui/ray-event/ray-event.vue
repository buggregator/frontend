<script lang="ts" setup>
import { ValueDump } from "~/src/shared/ui";
import type { RayContentEvent } from "../../types";

type Props = {
  content: RayContentEvent;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-event">
    <ValueDump v-if="content.class_based_event" :value="content.event" />
    <h3 class="ray-event__text">
      Event:
      <code class="ray-event__text-in">{{ content.name }}</code>
    </h3>
    <ValueDump v-if="content.payload" :value="String(content.payload)" />
  </div>
</template>

<style lang="scss" scoped>
.ray-event {
  display: block;
}

.ray-event__text {
  @apply p-3 border border-gray-300 dark:border-gray-600 bg-gray-800 flex w-full overflow-auto;
}

.ray-event__text-in {
  @apply font-semibold ml-1;
}
</style>
