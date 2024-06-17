<script lang="ts" setup>
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard, CodeSnippet } from "~/src/shared/ui";
import type { Monolog } from "../../types";

type Props = {
  event: NormalizedEvent<Monolog>;
};

defineProps<Props>();
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <CodeSnippet class="preview-card__snippet" :code="event.payload.message" />

    <CodeSnippet
      v-if="event.payload.context"
      class="preview-card__snippet"
      language="json"
      :code="event.payload.context"
    />

    <CodeSnippet
      v-for="(field, key) in event.payload.extra"
      :key="key"
      class="preview-card__snippet"
      :code="{ [key]: field }"
    />
  </PreviewCard>
</template>

<style lang="scss" scoped>
.preview-card {
  @apply text-xs break-all;
}

.preview-card__snippet {
  @apply relative bg-gray-200 dark:bg-gray-800 border-b-0 mt-0 text-white break-words;

  & + & {
    @apply border-t-2;
  }
}
</style>
