<script lang="ts" setup>
import { computed } from 'vue';
import type { Ref } from 'vue';
import { RouterLink } from 'vue-router';
import type { NormalizedEvent } from '@/shared/types';
import { PreviewCard } from '@/shared/ui';
import type { Sentry, SentryException as Exception } from '../../types';
import { SentryException } from '../sentry-exception';

type Props = {
  event: NormalizedEvent<Sentry>;
  maxFrames?: number;
};

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 3,
});

const eventLink = computed(() => `/sentry/${props.event.id}`);

const exceptionValues = computed(() => props.event?.payload?.exception?.values || []);

const hasException = computed(() => exceptionValues.value.length > 0);

const message = computed(() => props.event.payload?.message || '');

const exception: Ref<Exception> = computed(() =>
  exceptionValues.value.length > 0 ?
    exceptionValues.value[0]
  : {
      type: 'Unknown',
      value: 'Something went wrong',
      stacktrace: {
        frames: [],
      },
    },
);
</script>

<template>
  <PreviewCard
    class="preview-card"
    :event="event"
  >
    <SentryException
      v-if="hasException"
      :exception="exception"
      :max-frames="maxFrames"
    >
      <RouterLink
        :to="eventLink"
        class="preview-card__link"
      >
        <h3 class="preview-card__title">
          {{ exception.type }}
        </h3>

        <pre class="preview-card__text">{{ exception.value }}</pre>
      </RouterLink>
    </SentryException>

    <div v-if="message">
      <div class="preview-card__content">
        <pre class="preview-card__text">{{ message }}</pre>
      </div>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.preview-card {
}

.preview-card__link {
  @apply dark:bg-gray-800 bg-gray-100 p-3 border border-purple-300 dark:border-gray-500;
  @apply cursor-pointer block rounded-t-md;
}

.preview-card__title {
  @apply mb-3 font-semibold;
}

.preview-card__text {
  @include code-example();
  @apply text-sm break-words whitespace-pre-wrap overflow-auto text-opacity-60 dark:bg-gray-900;
  @apply p-3 mb-3;
}

.preview-card__frames {
  @apply border border-purple-200 dark:border-gray-500 flex-col justify-center w-full;
}
</style>
