<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { hasChildren, varSummary } from '../../lib/xdebug-format'
import type { XdebugVar } from '../../types'
import { XdebugIcon } from '../xdebug-icon'

type Props = {
  vars: XdebugVar[]
  changed?: Set<string>
  loading?: boolean
  stale?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  changed: () => new Set(),
  loading: false,
  stale: false,
  label: 'Variables'
})

const emit = defineEmits<{
  // Load the children of a node (page 0) or its next page.
  expand: [fullname: string, page: number]
  // Load the whole value of a cut string.
  showFull: [fullname: string]
}>()

type Row =
  | { kind: 'var'; v: XdebugVar; depth: number; parent: string | null }
  | { kind: 'more'; v: XdebugVar; depth: number; left: number }

const open = ref<Set<string>>(new Set())
const focused = ref<string | null>(null)
const busy = ref<Set<string>>(new Set())
const root = ref<HTMLElement | null>(null)

// A new pause keeps open top-level nodes open and loads their children again.
watch(() => props.vars, (vars) => {
  const reopen = [...open.value].filter((name) => vars.some((v) => name === v.fullname))
  open.value = new Set(reopen)
  reopen.forEach((name) => {
    const node = vars.find((v) => v.fullname === name)
    if (node && !node.children?.length) emit('expand', name, 0)
  })
})

const rows = computed(() => {
  const out: Row[] = []
  const walk = (list: XdebugVar[], depth: number, parent: string | null) => list.forEach((v) => {
    out.push({ kind: 'var', v, depth, parent })
    if (!open.value.has(v.fullname) || !hasChildren(v)) return
    walk(v.children ?? [], depth + 1, v.fullname)
    const left = (v.numchildren ?? 0) - (v.children?.length ?? 0)
    if (v.children?.length && left > 0) out.push({ kind: 'more', v, depth: depth + 1, left })
  })
  walk(props.vars, 0, null)
  return out
})

const keyOf = (row: Row) => (row.kind === 'var' ? row.v.fullname : `more:${row.v.fullname}`)
const activeKey = computed(() => {
  const keys = rows.value.map(keyOf)
  return focused.value && keys.includes(focused.value) ? focused.value : keys[0] ?? null
})

const toggle = (v: XdebugVar) => {
  if (!hasChildren(v)) return
  const next = new Set(open.value)
  if (next.has(v.fullname)) {
    next.delete(v.fullname)
  } else {
    next.add(v.fullname)
    if (!v.children?.length) emit('expand', v.fullname, 0)
  }
  open.value = next
}

// Xdebug cuts long strings; `size` is the whole length in bytes.
const isCut = (v: XdebugVar) => !!v.size && v.size > (v.value?.length ?? 0)
const bytes = (n: number | undefined) => ((n ?? 0) >= 1024 ? `${Math.round((n ?? 0) / 1024)} KB` : `${n ?? 0} bytes`)

const more = (v: XdebugVar) => emit('expand', v.fullname, (v.page ?? 0) + 1)

const focusRow = async (key: string | null) => {
  if (!key) return
  focused.value = key
  await nextTick()
  root.value?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus()
}

// WAI-ARIA tree: ↑/↓ move, → opens or goes to the first child, ← closes or
// goes to the parent, Home/End, Enter/Space toggle.
const onKey = (e: KeyboardEvent, index: number) => {
  const row = rows.value[index]
  const at = (i: number) => rows.value[i] && keyOf(rows.value[i])
  switch (e.key) {
    case 'ArrowDown': focusRow(at(index + 1) ?? null); break
    case 'ArrowUp': focusRow(at(index - 1) ?? null); break
    case 'Home': focusRow(at(0) ?? null); break
    case 'End': focusRow(at(rows.value.length - 1) ?? null); break
    case 'ArrowRight':
      if (row.kind === 'var' && hasChildren(row.v)) {
        if (!open.value.has(row.v.fullname)) toggle(row.v)
        else focusRow(at(index + 1) ?? null)
      }
      break
    case 'ArrowLeft':
      if (row.kind === 'var' && open.value.has(row.v.fullname)) toggle(row.v)
      else if (row.kind === 'var' && row.parent) focusRow(row.parent)
      else if (row.kind === 'more') focusRow(row.v.fullname)
      break
    case 'Enter':
    case ' ':
      if (row.kind === 'more') more(row.v)
      else if (hasChildren(row.v)) toggle(row.v)
      else if (isCut(row.v) && !row.v.full) full(row.v)
      break
    default:
      return
  }
  e.preventDefault()
}

const full = async (v: XdebugVar) => {
  busy.value = new Set([...busy.value, v.fullname])
  emit('showFull', v.fullname)
}
watch(() => props.vars, () => { busy.value = new Set() }, { deep: true })
</script>

<template>
  <div
    v-if="loading && !vars.length"
    class="xdebug-vars__skeleton"
    aria-busy="true"
  >
    <span
      v-for="w in [60, 45, 70, 35, 50]"
      :key="w"
      :style="{ width: `${w}%` }"
    />
  </div>
  <p
    v-else-if="!vars.length"
    class="xdebug-vars__empty"
  >
    No variables in this scope.
  </p>
  <ul
    v-else
    ref="root"
    class="xdebug-vars"
    :class="{ 'xdebug-vars--stale': stale }"
    role="tree"
    :aria-label="label"
  >
    <li
      v-for="(row, i) in rows"
      :key="keyOf(row)"
      :data-key="keyOf(row)"
      class="xdebug-vars__row"
      :class="{ 'is-more': row.kind === 'more' }"
      :style="{ '--d': row.depth }"
      role="treeitem"
      :aria-level="row.depth + 1"
      :aria-expanded="row.kind === 'var' && hasChildren(row.v) ? open.has(row.v.fullname) : undefined"
      :tabindex="keyOf(row) === activeKey ? 0 : -1"
      @keydown="onKey($event, i)"
      @focus="focused = keyOf(row)"
      @click.self="row.kind === 'var' ? toggle(row.v) : more(row.v)"
    >
      <template v-if="row.kind === 'var'">
        <span
          class="xdebug-vars__tw"
          @click="toggle(row.v)"
        >
          <XdebugIcon
            v-if="hasChildren(row.v)"
            :name="open.has(row.v.fullname) ? 'down' : 'right'"
          />
        </span>
        <span
          class="xdebug-vars__name"
          @click="toggle(row.v)"
        >
          <span
            v-if="row.v.facet"
            class="xdebug-vars__vis"
          >{{ row.v.facet }}</span>{{ row.v.name }}
        </span>
        <span
          v-if="changed.has(row.v.fullname)"
          class="xdebug-vars__changed"
        >changed</span>
        <span class="xdebug-vars__eq">=</span>
        <template v-if="hasChildren(row.v) || row.v.type === 'object' || row.v.type === 'array'">
          <span
            class="xdebug-vars__type"
            :title="row.v.class"
          >{{ varSummary(row.v).text }}</span>
          <span class="xdebug-vars__cnt">{{ varSummary(row.v).count }}</span>
        </template>
        <template v-else>
          <span
            class="xdebug-vars__val"
            :class="`xdebug-vars__val--${row.v.type}`"
            :title="row.v.value"
          >{{ varSummary(row.v).text }}</span>
          <span
            v-if="row.v.type !== varSummary(row.v).text"
            class="xdebug-vars__type"
          >{{ row.v.type }}</span>
          <button
            v-if="isCut(row.v) && !row.v.full"
            type="button"
            class="xdebug-vars__link"
            tabindex="-1"
            :disabled="busy.has(row.v.fullname)"
            @click="full(row.v)"
          >
            show full value ({{ bytes(row.v.size) }})
          </button>
          <span
            v-else-if="isCut(row.v)"
            class="xdebug-vars__type"
          >cut at {{ bytes(row.v.value?.length) }}</span>
        </template>
      </template>
      <template v-else>
        <span class="xdebug-vars__tw" />
        <button
          type="button"
          class="xdebug-vars__link"
          tabindex="-1"
          @click="more(row.v)"
        >
          show {{ Math.min(row.left, row.v.pagesize ?? 32) }} more of {{ row.left }}
        </button>
      </template>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.xdebug-vars {
  @apply list-none m-0 py-1 font-mono text-xs;

  line-height: 18px;
}

.xdebug-vars--stale {
  @apply opacity-60;
}

.xdebug-vars__row {
  @apply flex items-baseline gap-1.5 min-w-0 py-0.5 pr-3 cursor-default;

  padding-left: calc(8px + var(--d) * 16px);

  &[aria-expanded] {
    @apply cursor-pointer;
  }

  &:hover {
    @apply bg-gray-50 dark:bg-gray-700/50;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-500;
  }
}

.xdebug-vars__tw {
  @apply w-3 flex-none self-center text-gray-500 dark:text-gray-400;
}

.xdebug-vars__name {
  @apply whitespace-nowrap text-gray-900 dark:text-white;
}

.xdebug-vars__vis {
  @apply mr-1 text-gray-500 dark:text-gray-400;

  font-size: 10px;
}

.xdebug-vars__changed {
  @apply px-1 rounded font-sans font-semibold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/10;

  font-size: 9.5px;
}

.xdebug-vars__eq {
  @apply text-gray-500 dark:text-gray-400;
}

.xdebug-vars__val {
  @apply min-w-0 truncate text-gray-800 dark:text-gray-200;
}

.xdebug-vars__val--string {
  @apply text-green-700 dark:text-green-300;
}

.xdebug-vars__val--int,
.xdebug-vars__val--float {
  @apply text-amber-700 dark:text-amber-300;
}

.xdebug-vars__type,
.xdebug-vars__cnt {
  @apply whitespace-nowrap text-gray-500 dark:text-gray-400;

  font-size: 11px;
}

.xdebug-vars__link {
  @apply font-sans whitespace-nowrap underline text-blue-700 dark:text-blue-300 disabled:opacity-50;

  font-size: 11px;
}

.xdebug-vars__empty {
  @apply px-3 py-2 text-xs text-gray-500 dark:text-gray-400;
}

.xdebug-vars__skeleton {
  @apply flex flex-col gap-2.5 px-3 py-2;

  span {
    @apply block h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse;
  }
}
</style>
