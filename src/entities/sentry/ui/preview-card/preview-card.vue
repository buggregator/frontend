<script lang="ts" setup>
import { computed } from "vue";
import type { Ref } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type { Sentry, SentryException as Exception } from "../../types";
import { SentryException } from "../sentry-exception";

type Props = {
  event: NormalizedEvent<Sentry>;
  maxFrames?: number;
};

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 3,
});

const eventLink = computed(() => `/sentry/${props.event.id}`);

const exceptionValues = computed(
  () => props.event?.payload?.exception?.values || []
);

const hasException = computed(() => exceptionValues.value.length > 0);

const message = computed(() => props.event.payload?.message || "");

const exception: Ref<Exception> = computed(() =>
  exceptionValues.value.length > 0
    ? exceptionValues.value[0]
    : {
        type: "Unknown",
        value: "Something went wrong",
        stacktrace: {
          frames: [],
        },
      }
);
</script>

<template>
  <PreviewCard class="preview-card" :event="event">
    <SentryException
      v-if="hasException"
      :exception="exception"
      :max-frames="maxFrames"
    >
      <NuxtLink tag="div" :to="eventLink" class="preview-card__link">
        <h3 class="preview-card__title">
          {{ exception.type }}
        </h3>

        <pre class="preview-card__text" v-html="exception.value" />
      </NuxtLink>
    </SentryException>

    <div v-if="message">
      <NuxtLink tag="div" :to="eventLink" class="preview-card__link">
        <pre class="preview-card__text" v-html="message" />
      </NuxtLink>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import "assets/mixins";
.preview-card {
  @apply flex flex-col;
}

.preview-card__link {
  @apply cursor-pointer pb-2 flex-grow;
}

.preview-card__title {
  @apply mb-3 font-semibold;
}

.preview-card__text {
  @include text-muted;
  @apply text-sm break-all mb-3 p-3 dark:bg-gray-800 overflow-auto;
}

.preview-card__frames {
  @apply border border-purple-200 dark:border-gray-600 flex-col justify-center w-full;
}
</style>
