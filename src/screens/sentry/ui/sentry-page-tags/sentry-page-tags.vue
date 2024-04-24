<script lang="ts" setup>
import { computed } from "vue";
import type {
  Sentry,
  SentryContextRuntime,
  SentryContextOS,
} from "~/src/entities/sentry/types";

type Props = {
  payload: Sentry;
};

const props = defineProps<Props>();

const contextsRuntime = computed(() => {
  const { name = "", version = "" } =
    (props.payload.contexts?.runtime as SentryContextRuntime) || {};

  return { name, version };
});

const contextsOS = computed(() => {
  const { name = "", version = "" } =
    (props.payload.contexts?.os as SentryContextOS) || {};

  return { name, version };
});
</script>

<template>
  <section class="sentry-page-tags">
    <div class="sentry-page-tags__boxes">
      <div v-if="contextsRuntime.name" class="sentry-page-tags__box">
        <span class="sentry-page-tags__box-title">runtime</span>
        <h4 class="sentry-page-tags__box-name">{{ contextsRuntime.name }}</h4>
        <p class="sentry-page-tags__box-value">
          Version: {{ contextsRuntime.version }}
        </p>
      </div>

      <div v-if="contextsOS.name" class="sentry-page-tags__box">
        <span class="sentry-page-tags__box-title">os</span>
        <h4 class="sentry-page-tags__box-name">{{ contextsOS.name }}</h4>
        <p class="sentry-page-tags__box-value">
          Version: {{ contextsOS.version }}
        </p>
      </div>

      <div v-if="payload.sdk && payload.sdk.name" class="sentry-page-tags__box">
        <span class="sentry-page-tags__box-title">sdk</span>
        <h4 class="sentry-page-tags__box-name">{{ payload.sdk.name }}</h4>
        <p class="sentry-page-tags__box-value">
          Version: {{ payload.sdk.version }}
        </p>
      </div>
    </div>

    <div class="sentry-page-tags__labels-wrapper">
      <h3 class="sentry-page-tags__title">tags</h3>
      <div class="sentry-page-tags__labels">
        <div class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">env</div>
          <div class="sentry-page-tags__label-value">
            {{ payload.environment }}
          </div>
        </div>

        <div v-if="payload.release" class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">release</div>
          <div class="sentry-page-tags__label-value">
            {{ payload.release }}
          </div>
        </div>
        <div v-if="payload.logger" class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">logger</div>
          <div class="sentry-page-tags__label-value">
            {{ payload.logger }}
          </div>
        </div>
        <div v-if="contextsOS.name" class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">os</div>
          <div class="sentry-page-tags__label-value">
            {{ contextsOS.name }} {{ contextsOS.version }}
          </div>
        </div>
        <div v-if="contextsRuntime.name" class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">runtime</div>
          <div class="sentry-page-tags__label-value">
            {{ contextsRuntime.name }} {{ contextsRuntime.version }}
          </div>
        </div>
        <div v-if="payload.server_name" class="sentry-page-tags__label">
          <div class="sentry-page-tags__label-name">server name</div>
          <div class="sentry-page-tags__label-value">
            {{ payload.server_name }}
          </div>
        </div>

        <template v-if="payload.tags">
          <div
            v-for="(name, value) in payload.tags"
            :key="value"
            class="sentry-page-tags__label"
          >
            <div class="sentry-page-tags__label-name">{{ value }}</div>
            <div class="sentry-page-tags__label-value">
              {{ name || " - " }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.sentry-page-tags {
}

.sentry-page-tags__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page-tags__boxes {
  @apply flex items-stretch flex-col md:flex-row mb-5 gap-x-4;
}

.sentry-page-tags__box {
  @apply border border-purple-300 dark:border-gray-400 rounded px-4 pb-2 pt-1 hover:bg-purple-50 dark:hover:bg-purple-600 cursor-pointer mb-3 md:mb-0;
}

.sentry-page-tags__box-title {
  @include text-muted;
  @apply text-xs font-bold;
}

.sentry-page-tags__box-name {
  @apply font-bold;
}

.sentry-page-tags__box-value {
  @apply text-sm;
}

.sentry-page-tags__labels {
  @apply flex flex-row flex-wrap items-center text-purple-600 dark:text-purple-100 gap-3;
}

.sentry-page-tags__labels-wrapper {
  @apply bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-purple-300 dark:border-gray-400;
}

.sentry-page-tags__label {
  @apply flex border border-purple-300 rounded text-xs items-center;
}

.sentry-page-tags__label-name {
  @apply px-3 py-1 border-r;
}

.sentry-page-tags__label-value {
  @apply px-3 py-1 bg-purple-100 dark:bg-purple-800 rounded-r font-bold;
}
</style>
