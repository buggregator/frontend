<script lang="ts" setup>
import moment from "moment";
import { computed } from "vue";
import { SentryException } from "~/src/entities/sentry";
import type { Sentry } from "~/src/entities/sentry/types";
import { NormalizedEvent } from "~/src/shared/types";
import {
  SentryPageTags,
  SentryPageRequest,
  SentryPageDevice,
  SentryPageBreadcrumbs,
  SentryPageApp,
} from "./ui";

type Props = {
  event: NormalizedEvent<Sentry>;
};

const props = defineProps<Props>();

const formattedTimestamp = computed(() =>
  moment(props.event.payload.timestamp).toLocaleString()
);

const mainException = computed(
  () => props.event.payload?.exception?.values?.[0]
);
</script>

<template>
  <div class="sentry-page">
    <main class="sentry-page__main">
      <header v-if="mainException" class="sentry-page__main-header">
        <h1 class="sentry-page__main-exception">{{ mainException.type }}</h1>

        <pre
          class="sentry-page__main-exception-message"
          v-html="mainException.value"
        />
        <p class="sentry-page__main-date">{{ formattedTimestamp }}</p>
      </header>

      <header
        v-if="event.payload.message !== ''"
        class="sentry-page__main-header"
      >
        <pre
          class="sentry-page__main-exception-message"
          v-html="event.payload.message"
        />
        <p class="sentry-page__main-date">{{ formattedTimestamp }}</p>
      </header>

      <SentryPageTags :payload="event.payload" class="sentry-page__section" />

      <section v-if="mainException" class="sentry-page__section">
        <h3 class="sentry-page__section-title">exceptions</h3>

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
        v-if="event.payload.contexts.app"
        :app="event.payload.contexts.app"
        class="sentry-page__section"
      />

      <SentryPageDevice
        v-if="event.payload.contexts.device"
        :device="event.payload.contexts.device"
        class="sentry-page__section"
      />
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.sentry-page {
  @apply relative;
}

.sentry-page__main {
  @apply flex flex-col w-full;
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
  @apply text-sm;
}

.sentry-page__section {
  @apply py-5 px-4;
}

.sentry-page__section-exceptions {
  @apply flex flex-col gap-y-10;
}

.sentry-page__section-title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}
</style>
