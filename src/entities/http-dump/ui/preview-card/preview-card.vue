<script lang="ts" setup>
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type { HttpDump } from "../../types";

type Props = {
  event: NormalizedEvent<HttpDump>;
};

const props = defineProps<Props>();

const eventLink = `/http-dumps/${props.event.id}`;
const uri = decodeURI(props.event.payload.request.uri);
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <NuxtLink tag="div" :to="eventLink" class="preview-card__link">
      <span class="preview-card__method">
        {{ event.payload.request.method }} </span
      >:
      <span class="preview-card__uri">/{{ uri }}</span>
    </NuxtLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.preview-card {
  @apply flex flex-col;
}

.preview-card__link {
  @apply cursor-pointer flex-grow p-3 bg-gray-200 dark:bg-gray-800;
}

.preview-card__method {
  @apply font-mono;
}

.preview-card__uri {
  @apply font-mono font-bold;
}
</style>
