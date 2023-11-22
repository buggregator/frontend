<script lang="ts" setup>
import moment from "moment";
import { SentryBreadcrumb } from "~/src/entities/sentry/types";
import { CodeSnippet } from "~/src/shared/ui";

type Props = {
  breadcrumbs: SentryBreadcrumb[];
};

withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [] as SentryBreadcrumb[],
});

const formatDate = (timestamp: number): string =>
  moment.unix(timestamp).fromNow();
</script>

<template>
  <section class="sentry-page-breadcrumbs">
    <h3 class="sentry-page-breadcrumbs__title">breadcrumbs</h3>
    <div class="sentry-page-breadcrumbs__in">
      <nav
        style="grid-template-columns: 1fr 100px 200px 17px"
        class="sentry-page-breadcrumbs__nav"
      >
        <div class="sentry-page-breadcrumbs__nav-col-title">description</div>
        <div class="sentry-page-breadcrumbs__nav-col-title">level</div>
        <div class="sentry-page-breadcrumbs__nav-col-title">time</div>
      </nav>

      <div v-if="breadcrumbs" class="sentry-page-breadcrumbs__cols-wr">
        <div
          v-for="b in breadcrumbs"
          :key="b"
          class="sentry-page-breadcrumbs__cols"
        >
          <div class="sentry-page-breadcrumbs__col">
            <p class="sentry-page-breadcrumbs__col-message">{{ b.message }}</p>

            <CodeSnippet
              v-if="b.data"
              class="mt-3"
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
            {{ b.level }}
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
@import "assets/mixins";

.sentry-page-breadcrumbs {
  @apply py-5 px-4;
}

.sentry-page-breadcrumbs__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page-breadcrumbs__in {
  @apply flex flex-col border border-purple-300 dark:border-purple-700 rounded;
  max-height: 600px;
}

.sentry-page-breadcrumbs__nav {
  @apply border-b border-purple-300 dark:border-purple-700 grid bg-purple-50 dark:bg-purple-800 text-xs font-bold text-purple-600 dark:text-purple-100 rounded-t;
}

.sentry-page-breadcrumbs__nav-col-title {
  @apply p-3 uppercase;
}

.sentry-page-breadcrumbs__cols-wr {
  @apply bg-gray-100 dark:bg-gray-800 max-h-full flex-1 overflow-y-scroll divide-y divide-purple-300 dark:divide-purple-600;
}

.sentry-page-breadcrumbs__cols {
  @apply grid text-xs;
  grid-template-columns: 1fr 100px 200px;
}

.sentry-page-breadcrumbs__col {
  @apply p-3;
}

.sentry-page-breadcrumbs__col-message {
  @apply font-bold;
}

.sentry-page-breadcrumbs__col-details {
  @apply flex flex-row flex-wrap items-center text-purple-600 dark:text-purple-100 text-2xs my-3 gap-3;
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
</style>
