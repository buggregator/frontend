<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AssistSummary } from './assist-api'
import { agoOf, splitTitle } from './assist-texts'

// «Recent threads»: the last ~10, to jump back to an event or a page. Arrow
// keys move between them, Esc closes and gives focus back to the button.

type Props = { threads: AssistSummary[]; currentId: number | null; loaded: boolean }

defineProps<Props>()
const emit = defineEmits<{ pick: [thread: AssistSummary]; close: [] }>()

const root = ref<HTMLElement | null>(null)
const items = () => Array.from(root.value?.querySelectorAll<HTMLElement>('.ap-recent__item') ?? [])

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const list = items()
  const i = list.indexOf(document.activeElement as HTMLElement)
  const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
  list[next]?.focus()
}

// A click outside closes it.
const onPointer = (e: PointerEvent) => {
  const t = e.target as Node
  if (root.value && !root.value.contains(t) && !(t as HTMLElement).closest?.('[data-ap-recent-toggle]')) emit('close')
}

onMounted(async () => {
  document.addEventListener('pointerdown', onPointer)
  await nextTick()
  items()[0]?.focus()
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointer))
</script>

<template>
  <div
    id="ap-recent"
    ref="root"
    class="ap-recent"
    role="dialog"
    aria-label="Recent threads"
    @keydown="onKeydown"
  >
    <p class="ap-recent__head">
      Recent threads · last 10
    </p>
    <p
      v-if="!loaded"
      class="ap-recent__empty"
      role="status"
    >
      Loading…
    </p>
    <p
      v-else-if="!threads.length"
      class="ap-recent__empty"
    >
      No threads yet. Ask something on any page.
    </p>
    <ul
      v-else
      class="ap-recent__list"
    >
      <li
        v-for="t in threads"
        :key="t.id"
      >
        <button
          type="button"
          class="ap-recent__item"
          :aria-current="t.id === currentId ? 'true' : undefined"
          @click="emit('pick', t)"
        >
          <span class="ap-recent__title">{{ splitTitle(t.title || t.key).subject || t.key }}</span>
          <span class="ap-recent__meta">
            {{ splitTitle(t.title || '').kind || (t.kind === 'page' ? 'Page' : 'Event') }}<template v-if="t.project"> · {{ t.project }}</template>
          </span>
          <span class="ap-recent__ago">{{ agoOf(t.updated_at) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
