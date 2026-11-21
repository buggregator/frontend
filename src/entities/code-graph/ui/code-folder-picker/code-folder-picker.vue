<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { crumbs, useFolderBrowser } from '../../lib/use-folder-browser'
import type { CodeFolder, CodeRootStatus } from '../../types'

// «Add folder» on the Code page (#6586): browse one level at a time below the
// server's base dir and add the open folder; indexing starts right away.
// A native modal dialog: focus stays inside, Esc closes.

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'added', root: CodeRootStatus): void
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const b = useFolderBrowser()
const name = ref('')
const showHidden = ref(false)

const baseName = computed(() => b.list.value?.base_dir.split(/[\\/]/).filter(Boolean).pop() ?? 'base')
const trail = computed(() => crumbs(b.list.value?.path ?? '', baseName.value))
const here = computed(() => b.list.value?.path ?? '')
const hereName = computed(() => trail.value[trail.value.length - 1]?.name ?? '')
const folders = computed(() => (b.list.value?.folders ?? []).filter((f) => showHidden.value || !f.hidden))
const hiddenCount = computed(() => (b.list.value?.folders ?? []).filter((f) => f.hidden).length)

// Why the open folder cannot be added, if it cannot.
const blocked = computed(() => {
  if (b.loading.value) return 'Loading…'
  if (!b.list.value) return b.error.value ? 'Pick another folder.' : 'Loading…'
  if (!here.value) return 'Open a folder inside the base folder to add it.'
  if (b.list.value.root) return `Already indexed as «${b.list.value.root}».`
  return null
})

const go = (path: string) => {
  name.value = ''
  b.open(path)
}
const note = (f: CodeFolder) => (f.root ? `indexed as ${f.root}` : f.excluded ? 'skipped by the index' : null)

const add = async () => {
  if (blocked.value || b.adding.value) return
  const root = await b.add(here.value, name.value)
  if (root) {
    // Close first: focus goes back to «Add folder».
    dialog.value?.close()
    emit('added', root)
  }
}

onMounted(() => {
  dialog.value?.showModal()
  b.open('')
})
</script>

<template>
  <dialog
    ref="dialog"
    class="cg-picker"
    aria-labelledby="cg-picker-title"
    @close="emit('close')"
    @cancel.prevent="dialog?.close()"
  >
    <header class="cg-picker__head">
      <h2
        id="cg-picker-title"
        class="cg-picker__title"
      >
        Add a folder to the code graph
      </h2>
      <button
        type="button"
        class="cg-picker__x"
        aria-label="Close"
        @click="dialog?.close()"
      >
        ×
      </button>
    </header>

    <p
      v-if="b.list.value"
      class="cg-picker__base"
    >
      Folders inside <code>{{ b.list.value.base_dir }}</code>
    </p>

    <nav
      class="cg-picker__crumbs"
      aria-label="Folder path"
    >
      <template
        v-for="(c, i) in trail"
        :key="c.path"
      >
        <span
          v-if="i"
          aria-hidden="true"
        >/</span>
        <button
          type="button"
          class="cg-picker__crumb"
          :aria-current="i === trail.length - 1 ? 'location' : undefined"
          @click="go(c.path)"
        >
          {{ c.name }}
        </button>
      </template>
    </nav>

    <p
      v-if="b.error.value"
      class="cg-picker__err"
      role="alert"
    >
      {{ b.error.value }}
    </p>

    <ul
      class="cg-picker__list"
      :aria-busy="b.loading.value"
      aria-label="Folders"
    >
      <li v-if="b.list.value?.parent !== null && b.list.value?.parent !== undefined">
        <button
          type="button"
          class="cg-picker__row"
          @click="go(b.list.value!.parent!)"
        >
          <span aria-hidden="true">↰</span> Up
        </button>
      </li>
      <li
        v-for="f in folders"
        :key="f.path"
      >
        <button
          type="button"
          class="cg-picker__row"
          :class="{ 'cg-picker__row--dim': f.hidden || f.excluded }"
          @click="go(f.path)"
        >
          <span aria-hidden="true">▸</span>
          <span class="cg-picker__name">{{ f.name }}</span>
          <span
            v-if="note(f)"
            class="cg-picker__note"
          >{{ note(f) }}</span>
        </button>
      </li>
      <li
        v-if="b.list.value && !folders.length"
        class="cg-picker__empty"
      >
        No folders here.
      </li>
    </ul>

    <label
      v-if="hiddenCount"
      class="cg-picker__check"
    >
      <input
        v-model="showHidden"
        type="checkbox"
      >
      Show hidden folders ({{ hiddenCount }})
    </label>

    <footer class="cg-picker__foot">
      <label class="cg-picker__field">
        <span>Project name</span>
        <input
          v-model="name"
          type="text"
          class="cg-picker__input"
          :placeholder="hereName || 'folder name'"
          :disabled="!!blocked"
          spellcheck="false"
          @keydown.enter.prevent="add"
        >
      </label>
      <p
        v-if="blocked"
        class="cg-picker__note"
      >
        {{ blocked }}
      </p>
      <p
        v-if="b.addError.value"
        class="cg-picker__err"
        role="alert"
      >
        {{ b.addError.value }}
      </p>
      <div class="cg-picker__acts">
        <button
          type="button"
          class="cg-picker__btn"
          @click="dialog?.close()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cg-picker__btn cg-picker__btn--primary"
          :disabled="!!blocked || b.adding.value"
          @click="add"
        >
          {{ b.adding.value ? 'Adding…' : here ? `Add «${hereName}» and index it` : 'Add this folder' }}
        </button>
      </div>
    </footer>
  </dialog>
</template>

<style lang="scss" scoped>
.cg-picker {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  padding: 0;
  border-radius: 8px;
  @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;

  &::backdrop {
    background: rgb(0 0 0 / 45%);
  }
}

.cg-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.cg-picker__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.cg-picker__x {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  font-size: 20px;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
}

.cg-picker__base {
  margin: 10px 16px 0;
  font-size: 12px;
  @apply text-gray-600 dark:text-gray-400;
}

.cg-picker__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
  padding: 8px 16px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.cg-picker__crumb {
  padding: 2px 4px;
  border-radius: 3px;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;

  &[aria-current] {
    font-weight: 600;
  }
}

.cg-picker__list {
  height: 280px;
  margin: 0 16px;
  padding: 4px 0;
  overflow-y: auto;
  list-style: none;
  border-radius: 6px;
  @apply border border-gray-200 dark:border-gray-700;
}

.cg-picker__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  text-align: left;
  font-size: 13px;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
}

.cg-picker__row--dim .cg-picker__name {
  opacity: 0.6;
}

.cg-picker__name {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.cg-picker__note {
  margin: 0 0 0 auto;
  font-size: 11px;
  @apply text-gray-600 dark:text-gray-400;
}

.cg-picker__foot .cg-picker__note {
  margin: 0;
  font-size: 12px;
}

.cg-picker__empty {
  padding: 12px;
  font-size: 13px;
  @apply text-gray-600 dark:text-gray-400;
}

.cg-picker__check {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 16px 0;
  font-size: 12px;
}

.cg-picker__foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
}

.cg-picker__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.cg-picker__input {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800;
}

.cg-picker__err {
  margin: 0 16px;
  font-size: 12px;
  color: #dc2626;

  .dark & {
    color: #f87171;
  }
}

.cg-picker__foot .cg-picker__err {
  margin: 0;
}

.cg-picker__acts {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cg-picker__btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  @apply border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.cg-picker__btn--primary {
  @apply bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold;
}

.cg-picker__x:focus-visible,
.cg-picker__crumb:focus-visible,
.cg-picker__row:focus-visible,
.cg-picker__btn:focus-visible,
.cg-picker__input:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 1px;
}
</style>
