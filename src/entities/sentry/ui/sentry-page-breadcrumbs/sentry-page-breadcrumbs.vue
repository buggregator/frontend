<script lang="ts" setup>
import moment from 'moment';
import { CodeSnippet } from '@/shared/ui';
import type { SentryBreadcrumb } from '../../types';

type Props = {
  breadcrumbs: SentryBreadcrumb[];
};

withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [] as SentryBreadcrumb[],
});

const formatDate = (timestamp?: number): string => timestamp
  ? moment.unix(timestamp).fromNow()
  : '';

const getClassByLevel = (breadcrumb: SentryBreadcrumb) => breadcrumb.level?.toLowerCase();

</script>

<template>
  <section class="sentry-page-breadcrumbs">
    <h3 class="sentry-page-breadcrumbs__title">
      breadcrumbs

      <span
        v-if="breadcrumbs.length > 0"
        class="sentry-page-breadcrumbs__counter"
      >{{
        breadcrumbs.length
      }}</span>
    </h3>
    <div class="sentry-page-breadcrumbs__in">
      <nav
        style="grid-template-columns: 1fr 100px 200px 17px"
        class="sentry-page-breadcrumbs__nav"
      >
        <div class="sentry-page-breadcrumbs__nav-col-title">
          description
        </div>
        <div class="sentry-page-breadcrumbs__nav-col-title">
          level
        </div>
        <div class="sentry-page-breadcrumbs__nav-col-title">
          time
        </div>
      </nav>

      <div
        v-if="breadcrumbs"
        class="sentry-page-breadcrumbs__cols-wr"
      >
        <div
          v-for="b in breadcrumbs"
          :key="b.toString()"
          class="sentry-page-breadcrumbs__cols"
        >
          <div class="sentry-page-breadcrumbs__col">
            <p class="sentry-page-breadcrumbs__col-message">
              {{ b.message }}
            </p>

            <CodeSnippet
              v-if="b.data"
              class="sentry-page-breadcrumbs__col-data"
              language="json"
              :code="b.data"
            />

            <div class="sentry-page-breadcrumbs__col-details">
              <div class="sentry-page-breadcrumbs__col-detail">
                <div class="sentry-page-breadcrumbs__col-detail-title">
                  type
                </div>
                <div class="sentry-page-breadcrumbs__col-detail-value">
                  {{ b.type }}
                </div>
              </div>
              <div class="sentry-page-breadcrumbs__col-detail">
                <div class="sentry-page-breadcrumbs__col-detail-title">
                  category
                </div>
                <div class="sentry-page-breadcrumbs__col-detail-value">
                  {{ b.category }}
                </div>
              </div>
            </div>
          </div>
          <div class="sentry-page-breadcrumbs__col">
            <span
              class="sentry-page-breadcrumbs__col-level-badge"
              :class="getClassByLevel(b)"
            >{{
              b.level
            }}</span>
          </div>
          <div class="sentry-page-breadcrumbs__col">
            {{ formatDate(b.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-page-breadcrumbs {
  @apply py-5 px-4;
}

.sentry-page-breadcrumbs__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page-breadcrumbs__counter {
  @apply bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-100;
  @apply rounded-full text-xs px-2 py-1 ml-2;
}

.sentry-page-breadcrumbs__in {
  @apply flex flex-col border border-purple-300 dark:border-gray-400 rounded overflow-hidden;
  max-height: 600px;
}

.sentry-page-breadcrumbs__nav {
  @apply border-purple-300 dark:border-purple-700;
  @apply bg-purple-50 dark:bg-purple-800 text-purple-600 dark:text-purple-100;
  @apply grid text-xs font-bold rounded-t border-b;
}

.sentry-page-breadcrumbs__nav-col-title {
  @apply p-3 uppercase;
}

.sentry-page-breadcrumbs__cols-wr {
  @apply bg-gray-100 dark:bg-gray-800divide-purple-300 dark:divide-purple-600;
  @apply max-h-full flex-1 overflow-y-scroll divide-y;
}

.sentry-page-breadcrumbs__cols {
  @apply grid text-xs;
  grid-template-columns: 1fr 100px 200px;
}

.sentry-page-breadcrumbs__col {
  @apply p-3;
}

.sentry-page-breadcrumbs__col-data {
  @apply mt-3  rounded-md overflow-hidden;
}

.sentry-page-breadcrumbs__col-message {
  @apply font-bold;
}

.sentry-page-breadcrumbs__col-details {
  @apply flex flex-row flex-wrap items-center text-2xs my-3 gap-3;
  @apply text-purple-600 dark:text-purple-100;
}

.sentry-page-breadcrumbs__col-detail {
  @apply flex border border-purple-300 dark:border-purple-700 rounded items-center;
}

.sentry-page-breadcrumbs__col-detail-title {
  @apply px-2 border-r dark:border-purple-700;
}

.sentry-page-breadcrumbs__col-detail-value {
  @apply px-2 bg-purple-100 dark:bg-purple-800 rounded-r font-bold;
}

.sentry-page-breadcrumbs__col-level-badge {
  @apply uppercase text-2xs font-bold rounded-full px-2 py-1;
}

.sentry-page-breadcrumbs__col-level-badge.debug {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-100;
}

.sentry-page-breadcrumbs__col-level-badge.error {
  @apply bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-100;
}

.sentry-page-breadcrumbs__col-level-badge.warning {
  @apply bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-100;
}

.sentry-page-breadcrumbs__col-level-badge.info {
  @apply bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-100;
}
</style>
