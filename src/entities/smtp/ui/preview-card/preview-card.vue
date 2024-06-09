<script lang="ts" setup>
import moment from "moment";
import { computed } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type { SMTP } from "../../types";

type Props = {
  event: NormalizedEvent<SMTP>;
};

const props = defineProps<Props>();
const eventLink = computed(() => `/smtp/${props.event.id}`);

const dateFormat = computed(() => moment(props.event.date).fromNow());

const emailRecipient = computed(
  () => props?.event?.payload?.to?.[0]?.email || null
);
</script>

<template>
  <PreviewCard class="smtp-preview" :event="event">
    <NuxtLink :to="eventLink" class="smtp-preview__link">
      <h3 class="smtp-preview__link-title">
        {{ event.payload.subject }}
      </h3>

      <div class="smtp-preview__link-text">
        <span v-if="emailRecipient">
          <strong>To:</strong> {{ emailRecipient }}
        </span>

        <span>{{ dateFormat }}</span>
      </div>
    </NuxtLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.smtp-preview {
}

.smtp-preview__link {
  @apply block flex items-stretch;
  @apply p-2 md:p-4;
  @apply flex flex-col;
  @apply border dark:border-gray-500 rounded-md overflow-hidden;
  @apply dark:bg-gray-800 dark:hover:bg-gray-900 hover:bg-white;
}

.smtp-preview__nav-item {
  @apply border dark:border-0;
}

.smtp-preview__link-title {
  @apply font-semibold dark:text-white;
  @apply text-xs md:text-sm;
  @apply mb-1 md:mb-2;
}

.smtp-preview__link-text {
  @include text-muted;
  @apply flex justify-between;
  @apply text-2xs md:text-xs;
}

.smtp-preview__link-text strong {
  @apply font-bold;
}
</style>
