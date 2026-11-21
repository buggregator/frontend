<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CodeAddFolder,
  CodeProjectGraph,
  CodeSearch,
  startSymbols,
  symbolLabel,
  useCodeGraphRequests,
  useCodeTree,
  type CodeGraphRoots,
  type CodeRootStatus,
  type CodeSymbol,
  type TreeRow
} from '@/entities/code-graph'
import { RouteName } from '@/shared/types'
import { pickedRoot } from '../../lib'

// The Code page without a symbol (#6577 «whole»): pick an indexed folder at
// the top and its whole graph is there at once. Left: «Start here» and the
// folder tree; both open the focus view of a function. «Add folder» (#6586)
// adds a folder below the server's base dir; one added here can be removed.

// `stamp` changes when the shown folder finishes (re)indexing: graph, «Start
// here» and tree load again (the page is not re-created: an open dialog stays).
const props = defineProps<{ roots: CodeGraphRoots; stamp?: string }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const route = useRoute()
const router = useRouter()
const isPhone = useMediaQuery('(max-width: 767px)')
const api = useCodeGraphRequests()

const asked = computed(() => (typeof route.query.root === 'string' ? route.query.root : null))
const rootStatus = computed(() => pickedRoot(props.roots, asked.value))
const root = computed(() => rootStatus.value?.name ?? null)
const pickRoot = (name: string) => {
  if (name !== root.value) router.replace({ name: RouteName.Code, query: { root: name } })
}

// Adding and removing folders.
const picker = computed(() => props.roots.picker)
const canManage = computed(() => !!picker.value?.enabled && !!picker.value.can_manage)
const pickerOpen = ref(false)
const hintOpen = ref(false)
const onAdd = () => {
  if (canManage.value) pickerOpen.value = true
  else hintOpen.value = !hintOpen.value
}
const onAdded = (r: CodeRootStatus) => {
  pickerOpen.value = false
  emit('changed')
  router.replace({ name: RouteName.Code, query: { root: r.name } })
}
const removable = computed(() => canManage.value && rootStatus.value?.source === 'ui')
const confirmRemove = ref(false)
const removeError = ref<string | null>(null)
watch(root, () => {
  confirmRemove.value = false
  removeError.value = null
})
const removing = ref(false)
const remove = async () => {
  const name = root.value
  if (!name || removing.value) return
  removing.value = true
  try {
    await api.removeRoot(name)
    confirmRemove.value = false
    // Go to another folder by name: the list still has the removed one
    // until the reload lands.
    const next = props.roots.roots.find((r) => r.name !== name)?.name
    router.replace({ name: RouteName.Code, query: next ? { root: next } : {} })
    emit('changed')
  } catch (e) {
    removeError.value = e instanceof Error ? e.message : String(e)
  } finally {
    removing.value = false
  }
}

const found = ref<CodeSymbol[] | null>(null)
// How many found symbols sit in a drawn box; search answers 20 at most.
const matched = ref(0)
const SEARCH_CAP = 20
const foundText = computed(() => {
  const n = found.value?.length ?? 0
  if (!n) return 'Nothing found'
  const total = n >= SEARCH_CAP ? `${SEARCH_CAP}+` : String(n)
  return matched.value ? `${total} found, ${matched.value} in the graph` : `${total} found, none in the drawn graph`
})
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
  [root, () => props.stamp],
  async ([name]) => {
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
watch(
  () => props.stamp,
  (now, before) => {
    if (before && now && now !== before && now.split('|')[0] === before.split('|')[0]) tree.reload()
  }
)
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
          :title="r.source === 'config' && picker?.enabled ? `${r.path} (set in the config file)` : r.path"
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
      <button
        v-if="picker"
        type="button"
        class="code-landing__btn"
        :aria-expanded="canManage ? undefined : hintOpen"
        @click="onAdd"
      >
        + Add folder
      </button>
      <template v-if="removable">
        <button
          v-if="!confirmRemove"
          type="button"
          class="code-landing__btn"
          @click="confirmRemove = true"
        >
          Remove {{ root }}
        </button>
        <span
          v-else
          class="code-landing__confirm"
          role="group"
          :aria-label="`Remove ${root}?`"
        >
          Remove «{{ root }}» from the graph? The folder stays on disk.
          <button
            type="button"
            class="code-landing__btn"
            :disabled="removing"
            @click="remove"
          >Remove</button>
          <button
            type="button"
            class="code-landing__btn"
            @click="confirmRemove = false"
          >Keep</button>
        </span>
      </template>
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
        {{ foundText }}
      </p>
    </div>
    <div
      v-if="hintOpen && !canManage && picker"
      class="code-landing__hint"
      role="status"
    >
      <p v-if="picker.hint">
        {{ picker.hint }}
      </p>
      <p v-if="!picker.enabled">
        For example, in <code>buggregator.yaml</code>:
      </p>
      <pre v-if="!picker.enabled">code_graph:
  base_dir: /home/you/projects</pre>
      <p v-if="!picker.enabled">
        or the environment: <code>CODE_GRAPH_BASE_DIR=/home/you/projects</code>
      </p>
    </div>
    <p
      v-if="removeError"
      class="code-landing__hint"
      role="alert"
    >
      {{ removeError }}
    </p>
    <CodeAddFolder
      v-if="pickerOpen"
      @close="pickerOpen = false"
      @added="onAdded"
    />

    <div
      v-if="!root"
      class="code-landing__empty"
    >
      No folders to show yet.<template v-if="canManage">
        Add one with «+ Add folder».
      </template>
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
              v-if="!tree.dirs.value.has('') && !tree.failed.value"
              class="code-landing__note"
            >
              Loading…
            </li>
            <li
              v-else-if="!rows.length && !tree.failed.value"
              class="code-landing__note"
            >
              No indexed files yet.
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
          v-if="rootStatus && (rootStatus.state === 'indexing' || rootStatus.state === 'pending')"
          class="code-landing__note code-landing__note--top"
          role="status"
        >
          {{ root }} is still indexing: the graph fills in when it is done.
        </p>
        <CodeProjectGraph
          :root="root"
          :stamp="stamp"
          :found="found"
          @matched="matched = $event"
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

.code-landing__confirm {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.code-landing__hint {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  @apply border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300;

  p {
    margin: 0 0 4px;
  }

  pre {
    margin: 0 0 4px;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
    @apply bg-gray-100 dark:bg-gray-800;
  }
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
