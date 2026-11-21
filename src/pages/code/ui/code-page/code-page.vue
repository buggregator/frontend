<script lang="ts" setup>
import { useMediaQuery, useTitle } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import {
  CodeFocusGraph,
  CodeSearch,
  CodeSymbolPanel,
  fileBase,
  symbolLabel,
  type CodeSymbol,
  type FocusNode
} from '@/entities/code-graph'
import { RouteName } from '@/shared/types'
import { AppHeader } from '@/shared/ui'
import { pickedRoot, rootStamp, useCodeFocus, useRootsStatus, type FocusDirection, type FocusTarget } from '../../lib'
import { CodeLanding } from '../code-landing'

// Code page (#6573 variant A): one symbol in focus, callers left, callees
// right, depth 1–3; a side panel for the picked node. A way in from a stack
// frame arrives as ?file=&line=&from=&back=.

useTitle('Code | Buggregator')

const route = useRoute()
const router = useRouter()
const isPhone = useMediaQuery('(max-width: 767px)')

const q = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : undefined)
const num = (k: string) => {
  const v = Number(q(k))
  return Number.isFinite(v) && v > 0 ? v : undefined
}

const target = computed<FocusTarget>(() => ({
  symbol: num('symbol'),
  fqn: q('fqn'),
  root: q('root'),
  // A frame wins over a stale id: ids change on re-index, file:line does not.
  file: q('file'),
  line: num('line')
}))
const frameTarget = computed<FocusTarget>(() =>
  target.value.file && target.value.line ? { file: target.value.file, line: target.value.line, root: target.value.root } : target.value
)
const from = computed(() => q('from'))
const back = computed(() => q('back'))

const { roots, busy, failed: rootsFailed, reload: reloadRoots } = useRootsStatus()
// Tells the landing when its folder finishes (re)indexing.
const landingStamp = computed(() => rootStamp(pickedRoot(roots.value, target.value.root)))
const f = useCodeFocus(frameTarget)

const focusName = computed(() => (f.focus.value ? symbolLabel(f.focus.value).name : null))
const panelSymbol = computed(() => f.selected.value ?? f.focus.value)
const panelIsFocus = computed(() => !f.selected.value || f.selected.value.id === f.focus.value?.id)
const rootPath = computed(() => roots.value?.roots.find((r) => r.name === panelSymbol.value?.root)?.path ?? null)
const markLine = computed(() => (panelIsFocus.value && target.value.file ? (target.value.line ?? null) : null))

const goTo = (s: Pick<CodeSymbol, 'id' | 'fqn' | 'root'>) => {
  router.push({ name: RouteName.Code, query: { symbol: String(s.id), fqn: s.fqn, root: s.root } })
}
const makeFocus = () => {
  if (f.selected.value) goTo(f.selected.value)
}

const indexing = computed(() => roots.value?.roots.filter((r) => r.state === 'indexing' || r.state === 'pending') ?? [])
const rootErrors = computed(() => roots.value?.roots.filter((r) => r.state === 'error') ?? [])
const indexedAgo = computed(() => {
  const times = roots.value?.roots.map((r) => r.indexed_at).filter(Boolean) as string[] | undefined
  if (!times?.length) return null
  const last = Math.max(...times.map((t) => Date.parse(t)))
  const min = Math.round((Date.now() - last) / 60000)
  return min < 1 ? 'indexed just now' : min < 60 ? `indexed ${min} min ago` : `indexed ${Math.round(min / 60)} h ago`
})

const directions: { value: FocusDirection; label: string }[] = [
  { value: 'callers', label: 'Callers' },
  { value: 'both', label: 'Both' },
  { value: 'callees', label: 'Callees' }
]

// Phone: a list of direct callers or callees; the graph opens full screen.
const phoneTab = ref<'callers' | 'callees'>('callees')
const graphOpen = ref(false)
watch(isPhone, (p) => {
  if (!p) graphOpen.value = false
})
const column = (c: number) => f.layout.value?.nodes.filter((n) => n.column === c) ?? []
// Distinct symbols one hop away, «more» included.
const directCount = (c: number) => column(c).reduce((n, x) => n + (x.role === 'more' ? (x.more ?? 0) : 1), 0)
const phoneRows = computed(() => column(phoneTab.value === 'callers' ? -1 : 1))
const rowLabel = (n: FocusNode) => (n.role === 'more' ? { name: `+${n.more} more`, owner: '' } : n.data ? symbolLabel(n.data) : { name: n.id, owner: '' })
const onRow = (n: FocusNode) => {
  if (n.role === 'more') f.expand(n.column)
  else if (n.data?.symbol_id) goTo({ id: n.data.symbol_id, fqn: n.data.fqn, root: f.focus.value?.root ?? '' })
}
</script>

<template>
  <LayoutBase>
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader keep-title>
        <h1 class="code-page__title">
          Code
        </h1>
        <template #controls>
          <span
            v-if="busy"
            class="code-page__status code-page__status--busy"
          >indexing…</span>
          <span
            v-else-if="indexedAgo"
            class="code-page__status"
          >{{ indexedAgo }}</span>
        </template>
      </AppHeader>
    </template>

    <div
      v-if="roots && !roots.enabled"
      class="code-page__empty"
    >
      <h2 class="code-page__empty-title">
        The code graph is off
      </h2>
      <p>
        Point Buggregator at your source folders and it shows who calls what, and jumps from a stack frame
        straight to the function.
      </p>
      <p v-if="roots.picker?.hint">
        {{ roots.picker.hint }}
      </p>
      <RouterLink
        :to="{ name: RouteName.Settings, hash: '#code-graph' }"
        class="code-page__btn"
      >
        How to turn it on
      </RouterLink>
    </div>

    <div
      v-else
      class="code-page"
      :class="{ 'code-page--phone': isPhone }"
    >
      <div
        v-if="f.state.value !== 'idle'"
        class="code-page__bar"
      >
        <RouterLink
          :to="{ name: RouteName.Code, query: { root: f.focus.value?.root ?? target.root } }"
          class="code-page__btn"
        >
          ← Whole project
        </RouterLink>
        <CodeSearch @pick="goTo" />
        <template v-if="f.focus.value">
          <h2 class="code-page__focus">
            {{ symbolLabel(f.focus.value).owner ? `${symbolLabel(f.focus.value).owner} :: ` : '' }}{{ focusName }}
          </h2>
          <div
            v-if="!isPhone"
            class="code-page__controls"
          >
            <div
              class="code-page__seg"
              role="radiogroup"
              aria-label="Show"
            >
              <button
                v-for="d in directions"
                :key="d.value"
                type="button"
                role="radio"
                :aria-checked="f.direction.value === d.value"
                class="code-page__seg-btn"
                @click="f.direction.value = d.value"
              >
                {{ d.label }}
              </button>
            </div>
            <div
              class="code-page__seg"
              role="radiogroup"
              aria-label="Depth"
            >
              <button
                v-for="d in [1, 2, 3]"
                :key="d"
                type="button"
                role="radio"
                :aria-checked="f.depth.value === d"
                :aria-label="`Depth ${d}`"
                class="code-page__seg-btn"
                @click="f.depth.value = d"
              >
                {{ d }}
              </button>
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="from && f.focus.value"
        class="code-page__banner"
        role="status"
      >
        <span>
          Opened from <b>{{ from }}</b>.
          <template v-if="target.line && target.file">
            Line {{ target.line }} is inside <code>{{ focusName }}</code> (lines {{ f.focus.value.line_start }}–{{ f.focus.value.line_end }}).
          </template>
        </span>
        <RouterLink
          v-if="back"
          :to="back"
          class="code-page__btn"
        >
          Back to the error
        </RouterLink>
      </div>
      <p
        v-for="r in indexing"
        :key="r.name"
        class="code-page__banner code-page__banner--info"
        role="status"
      >
        <code>{{ r.name }}</code>&nbsp;is still indexing<template v-if="r.files">
          &nbsp;({{ r.files_seen ?? 0 }} / {{ r.files }} files)
        </template>. Calls into it may be missing.
      </p>
      <p
        v-for="r in rootErrors"
        :key="r.name"
        class="code-page__banner code-page__banner--err"
      >
        <code>{{ r.name }}</code>: {{ r.error || 'indexing failed' }}.
        <RouterLink :to="{ name: RouteName.Settings, hash: '#code-graph' }">
          Settings › Code graph
        </RouterLink>
      </p>

      <CodeLanding
        v-if="f.state.value === 'idle' && roots"
        :stamp="landingStamp"
        :roots="roots"
        @changed="reloadRoots"
      />
      <div
        v-else-if="f.state.value === 'idle' && rootsFailed"
        class="code-page__empty"
        role="alert"
      >
        <h2 class="code-page__empty-title">
          Could not load the indexed folders
        </h2>
        <p>You can still find a symbol by name.</p>
        <CodeSearch @pick="goTo" />
        <button
          type="button"
          class="code-page__btn"
          @click="reloadRoots()"
        >
          Try again
        </button>
      </div>
      <div
        v-else-if="f.state.value === 'not-found'"
        class="code-page__empty"
      >
        <h2 class="code-page__empty-title">
          Not in the code graph
        </h2>
        <p v-if="target.file">
          No function or method at <code>{{ fileBase(target.file) }}:{{ target.line }}</code> in the indexed folders.
        </p>
        <p v-else>
          This symbol is gone, maybe after a re-index. Find it again above.
        </p>
        <RouterLink
          v-if="back"
          :to="back"
          class="code-page__btn"
        >
          Back to the error
        </RouterLink>
      </div>
      <div
        v-else-if="f.state.value === 'error'"
        class="code-page__empty"
        role="alert"
      >
        <h2 class="code-page__empty-title">
          Could not load the graph
        </h2>
        <p>{{ f.error.value }}</p>
        <button
          type="button"
          class="code-page__btn"
          @click="f.reload()"
        >
          Try again
        </button>
      </div>

      <template v-else-if="f.focus.value">
        <!-- Phone: focus card and a list; the graph full screen on demand -->
        <div
          v-if="isPhone && !graphOpen"
          class="code-page__phone"
        >
          <div
            class="code-page__phone-tabs"
            role="tablist"
            aria-label="Direct calls"
          >
            <button
              v-for="t in (['callers', 'callees'] as const)"
              :key="t"
              type="button"
              role="tab"
              :aria-selected="phoneTab === t"
              class="code-page__phone-tab"
              @click="phoneTab = t"
            >
              {{ t === 'callers' ? 'Callers' : 'Callees' }} {{ directCount(t === 'callers' ? -1 : 1) }}
            </button>
          </div>
          <ul
            class="code-page__rows"
            role="tabpanel"
          >
            <li
              v-for="n in phoneRows"
              :key="n.id"
            >
              <button
                type="button"
                class="code-page__row"
                :disabled="n.role !== 'more' && !n.data?.symbol_id"
                @click="onRow(n)"
              >
                <span class="code-page__row-name">{{ rowLabel(n).name }}</span>
                <span class="code-page__row-owner">{{ rowLabel(n).owner }}</span>
                <span
                  v-if="n.guessed"
                  class="code-page__row-note"
                >≈ by name</span>
                <span
                  v-else-if="n.data?.external"
                  class="code-page__row-note"
                >not indexed</span>
              </button>
            </li>
            <li
              v-if="!phoneRows.length"
              class="code-page__row-empty"
            >
              {{ f.state.value === 'loading' ? 'Loading…' : phoneTab === 'callers' ? 'Nothing calls it.' : 'It calls nothing indexed.' }}
            </li>
          </ul>
          <button
            type="button"
            class="code-page__btn code-page__btn--wide"
            @click="graphOpen = true"
          >
            Open as a graph
          </button>
          <CodeSymbolPanel
            :symbol="f.focus.value"
            :is-focus="true"
            :root-path="rootPath"
            :mark-line="markLine"
            :snippets="!!roots?.snippets"
          />
        </div>

        <div
          v-else
          class="code-page__main"
          :class="{ 'code-page__main--full': graphOpen }"
        >
          <button
            v-if="graphOpen"
            type="button"
            class="code-page__btn code-page__close"
            @click="graphOpen = false"
          >
            Close the graph
          </button>
          <div
            class="code-page__graph"
            :aria-busy="f.state.value === 'loading'"
          >
            <CodeFocusGraph
              v-if="f.layout.value"
              :layout="f.layout.value"
              :selected-id="f.selectedId.value"
              @select="f.select"
              @expand="f.expand"
            />
            <p
              v-if="f.layout.value?.truncated"
              class="code-page__trunc"
            >
              Too many calls to draw them all: the busiest are shown.
            </p>
          </div>
          <CodeSymbolPanel
            v-if="panelSymbol && !graphOpen"
            class="code-page__panel"
            :symbol="panelSymbol"
            :is-focus="panelIsFocus"
            :root-path="rootPath"
            :mark-line="markLine"
            :snippets="!!roots?.snippets"
            :focus-name="focusName"
            @make-focus="makeFocus"
            @back="f.select(null)"
          />
        </div>
      </template>
      <div
        v-else
        class="code-page__empty"
        aria-busy="true"
      >
        Loading…
      </div>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.code-page__title {
  @apply text-sm font-semibold;
}

.code-page__status {
  font-size: 12px;

  @apply text-gray-600 dark:text-gray-400;
}

.code-page__status--busy {
  color: #2563eb;

  .dark & {
    color: #60a5fa;
  }
}

.code-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.code-page__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 16px;

  @apply border-b border-gray-200 dark:border-gray-700;
}

.code-page__focus {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
}

.code-page__controls {
  display: flex;
  gap: 12px;
}

.code-page__seg {
  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;

  @apply border border-gray-300 dark:border-gray-600;
}

.code-page__seg-btn {
  min-width: 32px;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;

  @apply text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700;

  &[aria-checked='true'] {
    @apply bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold;
  }

  & + & {
    @apply border-l border-gray-300 dark:border-gray-600;
  }
}

.code-page__banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;

  border-bottom: 1px solid #fde68a;
  background: #fffbeb;

  .dark & {
    border-color: rgb(251 191 36 / 0.3);
    background: rgb(251 191 36 / 0.1);
  }
}

.code-page__banner--info {
  justify-content: flex-start;
  gap: 0;

  border-color: #bfdbfe;
  background: #eff6ff;

  .dark & {
    border-color: rgb(96 165 250 / 0.3);
    background: rgb(96 165 250 / 0.1);
  }
}

.code-page__banner--err {
  justify-content: flex-start;

  border-color: #fecaca;
  background: #fef2f2;

  .dark & {
    border-color: rgb(248 113 113 / 0.3);
    background: rgb(248 113 113 / 0.1);
  }
}

.code-page__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.code-page__btn--wide {
  width: 100%;
  min-height: 44px;
}

.code-page__empty {
  max-width: 560px;
  margin: 48px auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;

  @apply text-gray-700 dark:text-gray-300;
}

.code-page__empty-title {
  font-size: 16px;
  font-weight: 700;

  @apply text-gray-900 dark:text-gray-100;
}

.code-page__main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
}

.code-page__main--full {
  position: fixed;
  inset: 0;
  z-index: 50;
  grid-template-columns: minmax(0, 1fr);

  @apply bg-white dark:bg-gray-900;
}

.code-page__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  min-height: 44px;
}

.code-page__graph {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.code-page__panel {
  @apply border-l border-gray-200 dark:border-gray-700;
}

.code-page__trunc {
  padding: 6px 12px;
  font-size: 12px;

  @apply text-gray-600 dark:text-gray-400;
}

.code-page__phone {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.code-page__phone-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 4px;
  overflow: hidden;

  @apply border border-gray-300 dark:border-gray-600;
}

.code-page__phone-tab {
  min-height: 44px;
  font-size: 13px;

  &[aria-selected='true'] {
    @apply bg-gray-100 dark:bg-gray-700 font-semibold;
  }
}

.code-page__rows {
  border-radius: 4px;

  @apply border border-gray-200 dark:border-gray-700;
}

.code-page__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  text-align: left;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;

  @apply hover:bg-gray-50 dark:hover:bg-gray-800;
}

.code-page__row-name {
  font-weight: 600;
}

.code-page__row-owner {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @apply text-gray-600 dark:text-gray-400;
}

.code-page__row-note {
  font-size: 11px;

  @apply text-amber-700 dark:text-amber-400;
}

.code-page__row-empty {
  padding: 12px;
  font-size: 13px;

  @apply text-gray-600 dark:text-gray-400;
}
</style>
