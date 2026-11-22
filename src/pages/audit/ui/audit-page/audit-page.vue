<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { RouteName } from '@/shared/types'
import { AppHeader, SkeletonLoader, StatusPanel } from '@/shared/ui'
import { auditActionLabel, auditTime, isAuditFailure, isAuditRoute, useAuditLog } from '../../lib'

// Who did what on this server (#6772): sign-ins, sign-outs, deletions and
// other changes, newest first. Admins only; the server keeps 90 days.

useTitle('Audit log | Buggregator')

const { state, error, rows, hasMore, loadingMore, moreError, load, loadMore } = useAuditLog()

onMounted(load)
</script>

<template>
  <LayoutBase heading="Audit log">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader keep-title>
        <RouterLink
          :to="{ name: RouteName.Home }"
          class="audit-page__crumb"
        >
          Home
        </RouterLink>
        <span
          class="audit-page__sep"
          aria-hidden="true"
        >/</span>
        <span class="audit-page__current">Audit log</span>
      </AppHeader>
    </template>

    <div class="audit-page">
      <p class="audit-page__intro">
        Sign-ins, sign-outs and changes made on this server, newest first. Kept for 90 days.
      </p>

      <SkeletonLoader
        v-if="state === 'loading'"
        variant="card"
        aria-label="Loading the audit log"
      />
      <StatusPanel
        v-else-if="state === 'forbidden'"
        title="Only admins can see the audit log"
        text="Ask the person who runs this server to add your email to auth.admin_emails."
        data-test="audit-forbidden"
      />
      <StatusPanel
        v-else-if="state === 'error'"
        tone="error"
        title="Could not load the audit log"
        :text="error"
        action-label="Try again"
        @action="load"
      />
      <StatusPanel
        v-else-if="!rows.length"
        title="Nothing recorded yet"
        text="Sign-ins and changes show up here as they happen."
        data-test="audit-empty"
      />
      <template v-else>
        <table class="audit-page__table">
          <caption class="sr-only">
            Audit log, newest first
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Time
              </th>
              <th scope="col">
                Who
              </th>
              <th scope="col">
                Action
              </th>
              <th scope="col">
                Status
              </th>
              <th scope="col">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              data-test="audit-row"
            >
              <td class="audit-page__time">
                <time
                  :datetime="row.at"
                  :title="row.at"
                >{{ auditTime(row.at) }}</time>
              </td>
              <td class="audit-page__who">
                {{ row.user || 'guest' }}
              </td>
              <td class="audit-page__action">
                <span :class="{ 'audit-page__route': isAuditRoute(row.action) }">{{
                  auditActionLabel(row.action)
                }}</span>
                <span
                  v-if="row.target"
                  class="audit-page__target"
                >{{ row.target }}</span>
              </td>
              <td>
                <span
                  class="audit-page__status"
                  :class="{ 'audit-page__status--failed': isAuditFailure(row) }"
                >{{ row.status }}</span>
              </td>
              <td class="audit-page__ip">
                {{ row.ip }}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="hasMore || moreError"
          class="audit-page__more"
        >
          <p
            v-if="moreError"
            class="audit-page__more-error"
            role="alert"
          >
            Could not load older entries: {{ moreError }}
          </p>
          <button
            type="button"
            class="audit-page__more-btn"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading…' : moreError ? 'Try again' : 'Show older' }}
          </button>
        </div>
      </template>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.audit-page__crumb {
  @apply hidden sm:inline text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200 transition-colors;
}

.audit-page__sep {
  @apply hidden sm:inline text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.audit-page__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.audit-page {
  @apply flex flex-col gap-3 p-3 md:p-4;
}

.audit-page__intro {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.audit-page__table {
  @apply w-full text-sm text-left;
  @apply border border-gray-200 dark:border-gray-700 rounded;
  border-collapse: separate;
  border-spacing: 0;

  th {
    @apply px-3 py-2 text-xs font-medium uppercase tracking-wide;
    @apply text-gray-500 dark:text-gray-400;
    @apply border-b border-gray-200 dark:border-gray-700;
  }

  td {
    @apply px-3 py-2 align-top;
    @apply border-b border-gray-100 dark:border-gray-800;
  }

  tbody tr:last-child td {
    @apply border-b-0;
  }
}

.audit-page__time {
  @apply whitespace-nowrap text-gray-600 dark:text-gray-300;
}

.audit-page__who {
  @apply text-gray-900 dark:text-gray-100 break-all;
}

.audit-page__action {
  @apply flex flex-col gap-0.5;
  @apply text-gray-900 dark:text-gray-100;
}

.audit-page__route {
  @apply font-mono text-xs;
}

.audit-page__target {
  @apply font-mono text-xs break-all;
  @apply text-gray-500 dark:text-gray-400;
}

.audit-page__status {
  @apply font-mono text-xs text-gray-600 dark:text-gray-300;
}

.audit-page__status--failed {
  @apply text-red-600 dark:text-red-400;
}

.audit-page__ip {
  @apply font-mono text-xs whitespace-nowrap text-gray-500 dark:text-gray-400;
}

.audit-page__more {
  @apply flex flex-col items-center gap-2 pb-4;
}

.audit-page__more-error {
  @apply text-sm text-red-600 dark:text-red-400;
}

.audit-page__more-btn {
  @apply h-8 px-3 rounded text-sm font-medium;
  @apply text-gray-700 dark:text-gray-200;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply disabled:opacity-60 disabled:cursor-wait;
  @apply transition-colors;
}

/* Phone: each record as a small card; the header row is not needed. */
@media (max-width: 639px) {
  .audit-page__table {
    thead {
      @apply sr-only;
    }

    tr {
      @apply flex flex-wrap gap-x-3 gap-y-1 px-3 py-2;
      @apply border-b border-gray-100 dark:border-gray-800;
    }

    td {
      @apply p-0 border-0;
    }

    .audit-page__action {
      @apply w-full;
    }
  }
}
</style>
