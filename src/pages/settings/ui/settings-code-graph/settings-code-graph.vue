<script lang="ts" setup>
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { SETTINGS_ITEMS } from '@/shared/constants'
import {
  isRootBusy,
  mountHint,
  rootProgress,
  rootSize,
  rootStatus,
  rootTimeLeft
} from '../../lib/code-roots-format'
import { useCodeRoots } from '../../lib/use-code-roots'
import { SettingsRow } from '../settings-row'

// Settings › Code graph (#6573): the folders come only from the server config
// (a path typed in the browser would let anyone who reaches the port read
// files), so this section shows them and re-indexes, nothing more.

const { data, isLoading, error, sending, reindex, reindexAll, reload } = useCodeRoots()
const now = useNow({ interval: 1000 })

const roots = computed(() => data.value?.roots ?? [])
const isOff = computed(() => !!data.value && !data.value.enabled)
const anyBusy = computed(() => roots.value.some(isRootBusy))
const ICON = { ok: '✓ ', err: '✕ ', busy: '', wait: '' } as const
const rows = computed(() =>
  roots.value.map((root) => ({
    root,
    status: rootStatus(root, now.value.getTime()),
    left: rootTimeLeft(root, now.value.getTime()),
    progress: rootProgress(root)
  }))
)
const summary = computed(() => {
  const n = roots.value.length
  return n === 1 ? '1 folder from the server config' : `${n} folders from the server config`
})

const CONFIG_EXAMPLE = `code_graph:
  roots:
    - name: app
      path: /code`
const DOCKER_EXAMPLE = '-v $PWD:/code:ro -e CODE_GRAPH_ROOTS=/code'
</script>

<template>
  <div
    class="s-cg"
    data-test="code-graph-settings"
  >
    <SettingsRow :item="SETTINGS_ITEMS.codeGraph">
      <template #default>
        <button
          v-if="roots.length > 1"
          type="button"
          class="s-cg__btn"
          :disabled="sending.length > 0"
          data-test="code-graph-reindex-all"
          @click="reindexAll"
        >
          Reindex all
        </button>
      </template>

      <template #extra>
        <p
          v-if="isLoading"
          class="s-cg__note"
          role="status"
        >
          Loading the code graph state…
        </p>

        <div
          v-else-if="error && !data"
          class="s-cg__note s-cg__note--err"
          role="alert"
        >
          Could not load the code graph state: {{ error }}
          <button
            type="button"
            class="s-cg__btn"
            @click="reload"
          >
            Try again
          </button>
        </div>

        <div
          v-else-if="isOff"
          class="s-cg__off"
          data-test="code-graph-off"
        >
          <p class="s-cg__note">
            Off on this server. Name source folders in the server config and Buggregator parses them (PHP and Go) into a
            graph of who calls what. Only these folders are read, read only.
          </p>
          <p class="s-cg__label">
            buggregator.yaml
          </p>
          <pre class="s-cg__code">{{ CONFIG_EXAMPLE }}</pre>
          <p class="s-cg__label">
            Docker: mount the code read only
          </p>
          <pre class="s-cg__code">{{ DOCKER_EXAMPLE }}</pre>
          <a
            class="s-cg__link"
            href="https://docs.buggregator.dev"
            target="_blank"
            rel="noopener"
          >Documentation</a>
        </div>

        <template v-else>
          <p class="s-cg__summary">
            {{ summary }}
          </p>
          <p
            v-if="error"
            class="s-cg__note s-cg__note--err"
            role="alert"
          >
            {{ error }}
          </p>

          <table class="s-cg__table">
            <thead>
              <tr>
                <th scope="col">
                  Folder
                </th>
                <th scope="col">
                  Size
                </th>
                <th scope="col">
                  Index
                </th>
                <th scope="col">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="{ root, status, left, progress } in rows"
                :key="root.name"
                :data-root="root.name"
              >
                <td>
                  <div class="s-cg__name">
                    {{ root.name }}
                  </div>
                  <div class="s-cg__path">
                    {{ root.path }}
                  </div>
                </td>
                <td class="s-cg__size">
                  {{ rootSize(root) }}
                  <div
                    v-if="root.parse_errors"
                    class="s-cg__muted"
                  >
                    {{ root.parse_errors }} with syntax errors
                  </div>
                  <div
                    v-if="root.truncated"
                    class="s-cg__muted"
                  >
                    file limit reached (code_graph.max_files)
                  </div>
                </td>
                <td>
                  <div
                    class="s-cg__state"
                    :class="`s-cg__state--${status.tone}`"
                    data-test="code-root-state"
                  >
                    <span aria-hidden="true">{{ ICON[status.tone] }}</span>{{ status.text }}
                    <span
                      v-if="left"
                      class="s-cg__muted"
                    > · {{ left }}</span>
                  </div>
                  <div
                    v-if="root.state === 'indexing'"
                    class="s-cg__bar"
                    role="progressbar"
                    :aria-label="`Indexing ${root.name}`"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-valuenow="progress ?? undefined"
                  >
                    <span
                      class="s-cg__bar-fill"
                      :class="{ 's-cg__bar-fill--unknown': progress === null }"
                      :style="{ width: `${progress ?? 30}%` }"
                    />
                  </div>
                  <template v-if="root.state === 'error' && /^(read|open|stat|lstat)\b/i.test(root.error ?? '')">
                    <p class="s-cg__muted">
                      Nothing is readable at this path. Mount it read only:
                    </p>
                    <code class="s-cg__mount">{{ mountHint(root) }}</code>
                  </template>
                </td>
                <td class="s-cg__actions">
                  <button
                    type="button"
                    class="s-cg__btn"
                    :disabled="isRootBusy(root) || sending.includes(root.name)"
                    :aria-label="`${root.state === 'error' ? 'Try again' : 'Reindex'} ${root.name}`"
                    data-test="code-root-reindex"
                    @click="reindex(root.name)"
                  >
                    {{ root.state === 'error' ? 'Try again' : 'Reindex' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p
            class="sr-only"
            role="status"
          >
            {{ anyBusy ? 'Indexing in progress' : '' }}
          </p>

          <dl class="s-cg__facts">
            <div class="s-cg__fact">
              <dt>Skipped by default</dt>
              <dd><code>vendor</code>, <code>node_modules</code>, <code>.git</code> · files over 1 MB</dd>
            </div>
            <div class="s-cg__fact">
              <dt>Paths from errors and profiles</dt>
              <dd>mapped to these folders by <code>code_graph.path_map</code> in the server config</dd>
            </div>
            <div class="s-cg__fact">
              <dt>Code in API and MCP answers</dt>
              <dd data-test="code-graph-snippets">
                {{ data?.snippets ? 'On' : 'Off' }} · <code>code_graph.snippets</code>
              </dd>
            </div>
          </dl>
        </template>
      </template>
    </SettingsRow>
  </div>
</template>

<style lang="scss" scoped>
.s-cg {
  --cg-progress: #2563eb;
}

:global(.dark) .s-cg {
  --cg-progress: #60a5fa;
}

.s-cg__note {
  @apply mt-2 text-sm text-gray-600 dark:text-gray-300;
}

.s-cg__note--err {
  @apply text-red-700 dark:text-red-400 flex flex-wrap items-center gap-2;
}

.s-cg__summary {
  @apply mt-1 text-xs text-gray-600 dark:text-gray-300;
}

.s-cg__label {
  @apply mt-3 text-xs font-medium text-gray-700 dark:text-gray-200;
}

.s-cg__code {
  @apply mt-1 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all;
  @apply bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200;
}

.s-cg__link {
  @apply inline-block mt-3 text-sm underline underline-offset-2 text-blue-700 dark:text-blue-300;
}

.s-cg__btn {
  @apply px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap;
  @apply border border-gray-300 dark:border-gray-600;
  @apply text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;

  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}

.s-cg__table {
  @apply w-full mt-3 text-sm border-collapse;

  th {
    @apply text-left text-xs font-medium text-gray-600 dark:text-gray-300 pb-1.5 pr-3;
  }

  td {
    @apply align-top py-2 pr-3 border-t border-gray-200 dark:border-gray-700;
  }
}

.s-cg__name {
  @apply font-mono font-medium text-gray-900 dark:text-gray-100;
}

.s-cg__path,
.s-cg__size {
  @apply font-mono text-xs text-gray-600 dark:text-gray-300;
}

.s-cg__path {
  word-break: break-all;
}

.s-cg__muted {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.s-cg__state {
  @apply text-xs font-medium;
}

.s-cg__state--ok {
  @apply text-green-700 dark:text-green-400;
}

.s-cg__state--busy {
  color: var(--cg-progress);
}

.s-cg__state--err {
  @apply text-red-700 dark:text-red-400;
}

.s-cg__state--wait {
  @apply text-gray-600 dark:text-gray-300;
}

.s-cg__bar {
  @apply mt-1.5 h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700;
}

.s-cg__bar-fill {
  @apply block h-full rounded-full;
  background: var(--cg-progress);
  transition: width 300ms;
}

.s-cg__bar-fill--unknown {
  @apply opacity-60;
}

.s-cg__mount {
  @apply block mt-1 text-xs font-mono break-all text-gray-800 dark:text-gray-200;
}

.s-cg__actions {
  @apply text-right;
}

.s-cg__facts {
  @apply mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs;

  code {
    @apply font-mono;
  }
}

.s-cg__fact {
  @apply grid gap-3 py-1;
  grid-template-columns: 12rem minmax(0, 1fr);

  dt {
    @apply text-gray-600 dark:text-gray-400;
  }

  dd {
    @apply text-gray-800 dark:text-gray-200;
  }
}

@media (prefers-reduced-motion: reduce) {
  .s-cg__bar-fill {
    transition: none;
  }
}

// Phone: each folder is a block, 44 px buttons.
@media (max-width: 639px) {
  .s-cg__table {
    thead {
      @apply sr-only;
    }

    tr,
    td {
      @apply block;
    }

    td {
      @apply border-t-0 py-1;
    }

    tr {
      @apply border-t border-gray-200 dark:border-gray-700 py-2;
    }
  }

  .s-cg__actions {
    @apply text-left;
  }

  .s-cg__btn {
    @apply min-h-[44px] px-4;
  }

  .s-cg__fact {
    @apply grid-cols-1 gap-0.5;
  }
}
</style>
