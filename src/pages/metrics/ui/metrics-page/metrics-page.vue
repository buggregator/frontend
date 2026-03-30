<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import { REST_API_URL } from '@/shared/lib/io/constants'
import { useProfileStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { AppHeader } from '@/shared/ui'

useTitle('Metrics | Buggregator')

const { token } = storeToRefs(useProfileStore())

interface MetricsData {
  events: {
    received: Record<string, number>
    stored: Record<string, number>
    errors: number
  }
  connections: {
    websocket: number
    tcp: Record<string, number>
  }
  http: {
    requests_total: number
  }
  webhooks: {
    sent: number
    failed: number
  }
}

const emptyMetrics: MetricsData = {
  events: { received: {}, stored: {}, errors: 0 },
  connections: { websocket: 0, tcp: {} },
  http: { requests_total: 0 },
  webhooks: { sent: 0, failed: 0 }
}

const metrics = ref<MetricsData>({ ...emptyMetrics })
const loading = ref(true)
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function fetchMetrics() {
  try {
    const res = await fetch(`${REST_API_URL}/api/metrics`, {
      headers: { 'X-Auth-Token': token.value }
    })
    if (res.ok) {
      metrics.value = await res.json()
    }
  } catch {
    // silently use current/empty metrics
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMetrics()
  refreshInterval = setInterval(fetchMetrics, 5000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

function totalReceived(received: Record<string, number>): number {
  return Object.values(received).reduce((a, b) => a + b, 0)
}

function totalStored(stored: Record<string, number>): number {
  return Object.values(stored).reduce((a, b) => a + b, 0)
}

function totalTcp(tcp: Record<string, number>): number {
  return Object.values(tcp).reduce((a, b) => a + b, 0)
}

function formatEventType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
</script>

<template>
  <LayoutBase class="metrics-page">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader>
        <RouterLink
          :to="{ name: RouteName.Home }"
          class="nav__crumb"
        >
          Home
        </RouterLink>
        <span class="nav__sep">/</span>
        <span class="nav__current">Metrics</span>
      </AppHeader>
    </template>

    <div class="metrics-page__content">
      <!-- Loading -->
      <div
        v-if="loading"
        class="metrics-page__status"
      >
        <div class="metrics-page__spinner" />
        <span>Loading metrics...</span>
      </div>

      <template v-else>
        <!-- Top-level stat cards -->
        <div class="metrics-grid">
          <div class="stat-card stat-card--blue">
            <div class="stat-card__label">
              Events Received
            </div>
            <div class="stat-card__value">
              {{ totalReceived(metrics.events.received).toLocaleString() }}
            </div>
            <div class="stat-card__sub">
              total across all types
            </div>
          </div>

          <div class="stat-card stat-card--emerald">
            <div class="stat-card__label">
              Events Stored
            </div>
            <div class="stat-card__value">
              {{ totalStored(metrics.events.stored).toLocaleString() }}
            </div>
            <div class="stat-card__sub">
              currently in database
            </div>
          </div>

          <div class="stat-card stat-card--violet">
            <div class="stat-card__label">
              WebSocket Connections
            </div>
            <div class="stat-card__value">
              {{ metrics.connections.websocket }}
            </div>
            <div class="stat-card__sub">
              active right now
            </div>
          </div>

          <div class="stat-card stat-card--amber">
            <div class="stat-card__label">
              HTTP Requests
            </div>
            <div class="stat-card__value">
              {{ metrics.http.requests_total.toLocaleString() }}
            </div>
            <div class="stat-card__sub">
              total processed
            </div>
          </div>
        </div>

        <!-- Events breakdown -->
        <div class="metrics-section">
          <h3 class="metrics-section__title">
            Events by Type
          </h3>

          <div class="metrics-table-wrap">
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Received</th>
                  <th>Stored</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(count, type) in metrics.events.received"
                  :key="type"
                >
                  <td>
                    <span class="metrics-table__type-badge">{{
                      formatEventType(String(type))
                    }}</span>
                  </td>
                  <td class="metrics-table__number">
                    {{ count.toLocaleString() }}
                  </td>
                  <td class="metrics-table__number">
                    {{ (metrics.events.stored[type] ?? 0).toLocaleString() }}
                  </td>
                </tr>
                <tr
                  v-if="Object.keys(metrics.events.received).length === 0"
                  class="metrics-table__empty"
                >
                  <td colspan="3">
                    No events received yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="metrics.events.errors > 0"
            class="metrics-section__alert"
          >
            {{ metrics.events.errors }} ingestion error{{
              metrics.events.errors > 1 ? 's' : ''
            }}
            detected
          </div>
        </div>

        <!-- Connections -->
        <div class="metrics-grid metrics-grid--2">
          <div class="metrics-section">
            <h3 class="metrics-section__title">
              TCP Connections
            </h3>

            <div
              v-if="Object.keys(metrics.connections.tcp).length > 0"
              class="conn-list"
            >
              <div
                v-for="(count, server) in metrics.connections.tcp"
                :key="server"
                class="conn-item"
              >
                <span class="conn-item__name">{{ formatEventType(String(server)) }}</span>
                <span class="conn-item__count">{{ count }}</span>
              </div>
              <div class="conn-item conn-item--total">
                <span class="conn-item__name">Total</span>
                <span class="conn-item__count">{{ totalTcp(metrics.connections.tcp) }}</span>
              </div>
            </div>
            <p
              v-else
              class="metrics-section__empty"
            >
              No active TCP connections
            </p>
          </div>

          <div class="metrics-section">
            <h3 class="metrics-section__title">
              Webhooks
            </h3>

            <div class="conn-list">
              <div class="conn-item">
                <span class="conn-item__name">Sent</span>
                <span class="conn-item__count conn-item__count--green">{{
                  metrics.webhooks.sent
                }}</span>
              </div>
              <div class="conn-item">
                <span class="conn-item__name">Failed</span>
                <span
                  class="conn-item__count"
                  :class="{ 'conn-item__count--red': metrics.webhooks.failed > 0 }"
                >{{ metrics.webhooks.failed }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-refresh indicator -->
        <div class="metrics-page__refresh">
          <span class="metrics-page__refresh-dot" />
          Auto-refreshing every 5s
        </div>
      </template>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.metrics-page {
  display: block;
}

.nav__crumb {
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors;
}

.nav__sep {
  @apply text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.nav__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.metrics-page__content {
  @apply p-6 max-w-5xl mx-auto;
}

/* ── Status / Loading ─────────────────────────────────────── */
.metrics-page__status {
  @apply flex items-center justify-center gap-3 py-20;
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.metrics-page__spinner {
  @apply w-5 h-5 border-2 rounded-full;
  @apply border-gray-300 dark:border-gray-600;
  border-top-color: #3b82f6;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Stat cards grid ──────────────────────────────────────── */
.metrics-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.metrics-grid--2 {
  @apply lg:grid-cols-2;
}

.stat-card {
  @apply rounded-xl p-5;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
}

.stat-card__label {
  @apply text-xs font-medium uppercase tracking-wider mb-2;
  @apply text-gray-500 dark:text-gray-400;
}

.stat-card__value {
  @apply text-3xl font-bold tabular-nums tracking-tight;
  @apply text-gray-900 dark:text-gray-50;
}

.stat-card--blue .stat-card__value {
  @apply text-blue-600 dark:text-blue-400;
}
.stat-card--emerald .stat-card__value {
  @apply text-emerald-600 dark:text-emerald-400;
}
.stat-card--violet .stat-card__value {
  @apply text-violet-600 dark:text-violet-400;
}
.stat-card--amber .stat-card__value {
  @apply text-amber-600 dark:text-amber-400;
}

.stat-card__sub {
  @apply text-xs mt-1;
  @apply text-gray-400 dark:text-gray-500;
}

/* ── Sections ─────────────────────────────────────────────── */
.metrics-section {
  @apply rounded-xl p-5 mb-6;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
}

.metrics-section__title {
  @apply text-sm font-semibold mb-4;
  @apply text-gray-700 dark:text-gray-200;
}

.metrics-section__alert {
  @apply mt-3 text-xs font-medium px-3 py-2 rounded-lg;
  @apply bg-red-50 dark:bg-red-500/10;
  @apply text-red-600 dark:text-red-400;
}

.metrics-section__empty {
  @apply text-sm text-gray-400 dark:text-gray-500;
}

/* ── Events table ─────────────────────────────────────────── */
.metrics-table-wrap {
  @apply -mx-5 -mb-5;
}

.metrics-table {
  @apply w-full text-sm;

  th {
    @apply text-left text-xs font-medium uppercase tracking-wider px-5 py-2;
    @apply text-gray-400 dark:text-gray-500;
    @apply border-b border-gray-100 dark:border-gray-700;
  }

  td {
    @apply px-5 py-3;
    @apply border-b border-gray-50 dark:border-gray-700/50;
  }

  tbody tr:last-child td {
    @apply border-b-0;
  }

  tbody tr {
    @apply transition-colors;

    &:hover {
      @apply bg-gray-50 dark:bg-gray-700/30;
    }
  }
}

.metrics-table__type-badge {
  @apply inline-flex px-2 py-0.5 rounded text-xs font-medium;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-700 dark:text-gray-300;
}

.metrics-table__number {
  @apply font-mono text-right tabular-nums;
  @apply text-gray-600 dark:text-gray-300;
}

.metrics-table__empty td {
  @apply text-center text-gray-400 dark:text-gray-500 py-8;
}

/* ── Connection items ─────────────────────────────────────── */
.conn-list {
  @apply space-y-0;
}

.conn-item {
  @apply flex items-center justify-between py-2.5;
  @apply border-b border-gray-100 dark:border-gray-700/50;

  &:last-child {
    @apply border-b-0;
  }
}

.conn-item--total {
  @apply border-t border-gray-200 dark:border-gray-700 pt-3 mt-1;
}

.conn-item__name {
  @apply text-sm text-gray-600 dark:text-gray-300;

  .conn-item--total & {
    @apply font-medium;
  }
}

.conn-item__count {
  @apply font-mono text-sm font-medium tabular-nums;
  @apply text-gray-900 dark:text-gray-100;
}

.conn-item__count--green {
  @apply text-emerald-600 dark:text-emerald-400;
}
.conn-item__count--red {
  @apply text-red-600 dark:text-red-400;
}

/* ── Auto-refresh indicator ───────────────────────────────── */
.metrics-page__refresh {
  @apply flex items-center justify-center gap-2 py-4;
  @apply text-xs text-gray-400 dark:text-gray-500;
}

.metrics-page__refresh-dot {
  @apply w-1.5 h-1.5 rounded-full bg-emerald-500;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
