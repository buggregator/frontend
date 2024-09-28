<script lang="ts" setup>
import moment from 'moment';
import { computed } from 'vue';
import type { NormalizedEvent } from '@/shared/types';
import type { Sentry } from '../..//types';
import { SentryException } from '../sentry-exception';
import { SentryPageApp } from '../sentry-page-app';
import { SentryPageBreadcrumbs } from '../sentry-page-breadcrumbs';
import { SentryPageDevice } from '../sentry-page-device';
import { SentryPageExtra } from '../sentry-page-extra';
import { SentryPageRequest } from '../sentry-page-request';
import { SentryPageTags } from '../sentry-page-tags';

type Props = {
  event: NormalizedEvent<Sentry>;
};

const props = defineProps<Props>();

const formattedTimestamp = computed(() => moment(props.event.payload.timestamp).toLocaleString());

const mainException = computed(() => props.event.payload?.exception?.values?.[0]);

const exceptionsLength = computed(() => props.event?.payload?.exception?.values?.length || 0);
</script>

<template>
  <div class="sentry-page">
    <main class="sentry-page__main">
      <header
        v-if="mainException"
        class="sentry-page__main-header"
      >
        <h1 class="sentry-page__main-exception">
          {{ mainException.type }}
        </h1>

        <pre class="sentry-page__main-exception-message">{{ mainException.value }}</pre>

        <p class="sentry-page__main-date">
          {{ formattedTimestamp }}
        </p>
      </header>

      <SentryPageTags
        class="sentry-page__section"
        :payload="event.payload"
      />

      <section
        v-if="mainException"
        class="sentry-page__section"
      >
        <h3 class="sentry-page__section-title">
          exceptions

          <span
            v-if="exceptionsLength > 0"
            class="sentry-page__section-title__counter"
          >
            {{ exceptionsLength }}
          </span>
        </h3>

        <div class="sentry-page__section-exceptions">
          <template
            v-if="
              event.payload.exception &&
                event.payload.exception.values &&
                event.payload.exception.values.length > 0
            "
          >
            <SentryException
              v-for="e in event.payload.exception.values"
              :key="`exception-${e.value}-${e.type}`"
              :exception="e"
              :max-frames="10"
              class="sentry-page__section-exceptions__exception"
            />
          </template>
        </div>
      </section>

      <SentryPageBreadcrumbs
        v-if="
          event.payload.breadcrumbs &&
            event.payload.breadcrumbs.values &&
            event.payload.breadcrumbs.values.length > 0
        "
        :breadcrumbs="event.payload.breadcrumbs.values"
        class="sentry-page__section"
      />

      <SentryPageRequest
        v-if="event.payload.request"
        :request="event.payload.request"
        class="sentry-page__section"
      />

      <SentryPageApp
        v-if="event.payload.contexts && event.payload.contexts.app"
        :app="event.payload.contexts.app"
        class="sentry-page__section"
      />

      <SentryPageDevice
        v-if="event.payload.contexts && event.payload.contexts.device"
        :device="event.payload.contexts.device"
        class="sentry-page__section"
      />

      <SentryPageExtra
        v-if="event.payload.extra"
        :extra="event.payload.extra"
        class="sentry-page__section"
      />
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-page {
  @apply relative;
}

.sentry-page__main {
  @apply flex flex-col w-full pb-5;
}

.sentry-page__main-header {
  @apply bg-gray-50 dark:bg-gray-900 py-5 px-4 md:px-6 lg:px-8;
}

.sentry-page__main-exception {
  @apply font-bold text-sm sm:text-base md:text-lg lg:text-2xl break-all sm:break-normal mb-3;
}

.sentry-page__main-date {
  @include text-muted;
  @apply text-xs mt-3;
}

.sentry-page__main-exception-message {
  @include code-example();
  @apply text-sm rounded text-opacity-60;
}

.sentry-page__section {
  @apply py-5 px-4;
}

.sentry-page__section-title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page__section-title__counter {
  @apply bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-100;
  @apply rounded-full text-xs px-2 py-1 ml-2;
}

.sentry-page__section-exceptions {
  @apply flex flex-col -mx-4;
}

.sentry-page__section-exceptions__exception {
  @apply p-4;
}
</style>
