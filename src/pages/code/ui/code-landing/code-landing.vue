<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CodeProjectGraph,
  CodeSearch,
  startSymbols,
  symbolLabel,
  useCodeGraphRequests,
  useCodeTree,
  type CodeGraphRoots,
  type CodeSymbol,
  type TreeRow
} from '@/entities/code-graph'
import { RouteName } from '@/shared/types'

// The Code page without a symbol (#6577 «whole»): pick an indexed folder at
// the top and its whole graph is there at once. Left: «Start here» and the
// folder tree; both open the focus view of a function.

const props = defineProps<{ roots: CodeGraphRoots }>()

const route = useRoute()
const router = useRouter()
const isPhone = useMediaQuery('(max-width: 767px)')
const api = useCodeGraphRequests()

const ready = computed(() => props.roots.roots.filter((r) => r.state === 'ready' || (r.symbols ?? 0) > 0))
const asked = computed(() => (typeof route.query.root === 'string' ? route.query.root : null))
const root = computed(() => {
  const all = props.roots.roots
  if (asked.value && all.some((r) => r.name === asked.value)) return asked.value
  return ready.value[0]?.name ?? all[0]?.name ?? null
})
const rootStatus = computed(() => props.roots.roots.find((r) => r.name === root.value) ?? null)
const pickRoot = (name: string) => {
  if (name !== root.value) router.replace({ name: RouteName.Code, query: { root: name } })
}

const found = ref<CodeSymbol[] | null>(null)
watch(root, () => {
  found.value = null
})

const goTo = (s: { id: number; fqn: string; root?: string }) => {
  router.push({ name: RouteName.Code, query: { symbol: String(s.id), fqn: s.fqn, root: s.root ?? root.value ?? '' } })
}

// «Start here»: entry points (main, controllers, handlers) from the busiest
// part of the graph, then the most called functions (GET /api/code/top).
type StartRow = { id: number; fqn: string; kind: string; name: string; note: string }
const start = shallowRef<StartRow[] | null>(null)
const startFailed = ref(false)
let seq = 0
watch(
  root,
  async (name) => {
    const mine = ++seq
    start.value = null
    startFailed.value = false
    if (!name) return
    try {
      const [busiest, top] = await Promise.all([
        api.getGraph(name, { level: 'symbol', limit: 60, kinds: 'calls,instantiates' }).catch(() => null),
        api.getTop(name, 8)
      ])
      if (mine !== seq) return
      const rows: StartRow[] = startSymbols(busiest, 8)
        .filter((s) => s.entry)
        .slice(0, 3)
        .map((s) => ({ id: s.node.symbol_id!, fqn: s.node.fqn, kind: s.node.kind, name: s.node.name, note: 'entry point' }))
      for (const t of top) {
        if (rows.length >= 9) break
        if (!rows.some((r) => r.id === t.id)) {
          rows.push({ id: t.id, fqn: t.fqn, kind: t.kind, name: t.name, note: `${t.callers} ${t.callers === 1 ? 'caller' : 'callers'}` })
        }
      }
      start.value = rows
    } catch {
      if (mine === seq) startFailed.value = true
    }
  },
  { immediate: true }
)

const tree = useCodeTree(root)
const rows = computed(() => tree.rows())
const rowOpen = (r: TreeRow) => tree.open.value.has(r.key)
const rowHasKids = (r: TreeRow) => r.type !== 'symbol' || !!r.symbol.members?.length
const rowName = (r: TreeRow) => (r.type === 'symbol' ? symbolLabel(r.symbol).name : r.entry.name)
const onRow = (r: TreeRow) => {
  if (r.type === 'symbol' && (r.symbol.kind === 'function' || r.symbol.kind === 'method')) goTo(r.symbol)
  else tree.toggle(r.key)
}

// Phone: the lists first, the graph full screen on demand.
const graphOpen = ref(false)
watch(isPhone, (p) => {
  if (!p) graphOpen.value = false
})
</script>

<template>
  <div
    class="code-landing"
    :class="{ 'code-landing--phone': isPhone }"
  >
    <div class="code-landing__bar">
      <div
        class="code-landing__roots"
        role="radiogroup"
        aria-label="Project"
      >
        <button
          v-for="r in roots.roots"
          :key="r.name"
          type="button"
          role="radio"
          :aria-checked="r.name === root"
          class="code-landing__root"
          :title="r.path"
          @click="pickRoot(r.name)"
        >
          {{ r.name }}
          <span
            v-if="r.symbols"
            class="code-landing__root-count"
          >{{ r.symbols }}</span>
          <span
            v-else-if="r.state !== 'ready'"
            class="code-landing__root-count"
          >{{ r.state }}</span>
        </button>
      </div>
      <CodeSearch
        v-if="root"
        :root="root"
        placeholder="Find in this project"
        @pick="goTo"
        @found="found = $event"
      />
      <p
        v-if="found"
        class="code-landing__found"
        role="status"
      >
        {{ found.length ? `${found.length} found, lit up in the graph` : 'Nothing found' }}
      </p>
    </div>

    <div
      v-if="!root"
      class="code-landing__empty"
    >
      No folders to show yet.
    </div>

    <div
      v-else
      class="code-landing__main"
    >
      <aside
        v-if="!graphOpen"
        class="code-landing__side"
        aria-label="Ways in"
      >
        <section>
          <h2 class="code-landing__h">
            Start here
          </h2>
          <p
            v-if="startFailed"
            class="code-landing__note"
          >
            Could not load the busiest functions.
          </p>
          <p
            v-else-if="!start"
            class="code-landing__note"
          >
            Loading…
          </p>
          <p
            v-else-if="!start.length"
            class="code-landing__note"
          >
            No calls indexed in {{ root }} yet.
          </p>
          <ul
            v-else
            class="code-landing__list"
          >
            <li
              v-for="s in start"
              :key="s.id"
            >
              <button
                type="button"
                class="code-landing__item"
                @click="goTo(s)"
              >
                <span class="code-landing__item-name">{{ symbolLabel(s).name }}</span>
                <span class="code-landing__item-owner">{{ symbolLabel(s).owner }}</span>
                <span class="code-landing__item-note">{{ s.note }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="code-landing__h">
            Files
          </h2>
          <p
            v-if="tree.failed.value"
            class="code-landing__note"
          >
            {{ tree.failed.value }}
          </p>
          <ul class="code-landing__list code-landing__tree">
            <li
              v-for="r in rows"
              :key="r.key"
            >
              <button
                type="button"
                class="code-landing__item code-landing__item--tree"
                :style="{ paddingLeft: `${8 + r.depth * 14}px` }"
                :aria-expanded="rowHasKids(r) && !(r.type === 'symbol' && (r.symbol.kind === 'function' || r.symbol.kind === 'method')) ? rowOpen(r) : undefined"
                @click="onRow(r)"
              >
                <span
                  class="code-landing__caret"
                  aria-hidden="true"
                >{{ r.type === 'symbol' && !r.symbol.members?.length ? '' : rowOpen(r) ? '▾' : '▸' }}</span>
                <span class="code-landing__item-name">{{ rowName(r) }}</span>
                <span
                  v-if="r.type !== 'symbol'"
                  class="code-landing__item-note"
                >{{ r.entry.symbols }}</span>
                <span
                  v-else
                  class="code-landing__item-note"
                >{{ r.symbol.kind }}</span>
              </button>
            </li>
            <li
              v-if="!rows.length && !tree.failed.value"
              class="code-landing__note"
            >
              Loading…
            </li>
          </ul>
        </section>

        <button
          v-if="isPhone"
          type="button"
          class="code-landing__btn"
          @click="graphOpen = true"
        >
          Open the project graph
        </button>
      </aside>

      <div
        v-if="!isPhone || graphOpen"
        class="code-landing__graph"
        :class="{ 'code-landing__graph--full': graphOpen }"
      >
        <button
          v-if="graphOpen"
          type="button"
          class="code-landing__btn code-landing__close"
          @click="graphOpen = false"
        >
          Close the graph
        </button>
        <p
          v-if="rootStatus && rootStatus.state !== 'ready'"
          class="code-landing__note code-landing__note--top"
        >
          {{ root }} is {{ rootStatus.state }}: the graph fills in when it is done.
        </p>
        <CodeProjectGraph
          :root="root"
          :found="found"
          @open="goTo({ id: $event.symbol_id!, fqn: $event.fqn })"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.code-landing {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.code-landing__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 16px;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.code-landing__roots {
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  border-radius: 6px;
  @apply border border-gray-300 dark:border-gray-600;
}

.code-landing__root {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 13px;
  @apply text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700;

  &[aria-checked='true'] {
    @apply bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold;
  }

  & + & {
    @apply border-l border-gray-300 dark:border-gray-600;
  }

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: -2px;
  }
}

.code-landing__root-count {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.75;
}

.code-landing__found {
  margin: 0;
  font-size: 12px;
  @apply text-gray-600 dark:text-gray-400;
}

.code-landing__main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.code-landing__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 280px;
  flex-shrink: 0;
  padding: 12px;
  overflow-y: auto;
  @apply border-r border-gray-200 dark:border-gray-700;
}

.code-landing--phone .code-landing__main {
  flex-direction: column;
}

.code-landing--phone .code-landing__side {
  width: auto;
  border-right: 0;
}

.code-landing__h {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  @apply text-gray-600 dark:text-gray-400;
}

.code-landing__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.code-landing__item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: left;
  font-size: 13px;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: -2px;
  }
}

.code-landing__item-name {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: nowrap;
}

.code-landing__item-owner {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  @apply text-gray-600 dark:text-gray-400;
}

.code-landing__item--tree .code-landing__item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-landing__item-note {
  margin-left: auto;
  font-size: 11px;
  white-space: nowrap;
  @apply text-gray-600 dark:text-gray-400;
}

.code-landing__caret {
  width: 10px;
  flex-shrink: 0;
  font-size: 10px;
}

.code-landing__note {
  margin: 0;
  padding: 4px 8px;
  font-size: 12px;
  @apply text-gray-600 dark:text-gray-400;
}

.code-landing__note--top {
  padding: 8px 16px 0;
}

.code-landing__graph {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.code-landing__graph--full {
  position: fixed;
  inset: 0;
  z-index: 50;
  @apply bg-white dark:bg-gray-900;
}

.code-landing__btn {
  display: inline-flex;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.code-landing__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  min-height: 44px;
}

.code-landing__empty {
  padding: 32px 16px;
  font-size: 14px;
  @apply text-gray-700 dark:text-gray-300;
}
</style>
