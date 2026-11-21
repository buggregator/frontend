<script lang="ts" setup>
import { computed } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { symbolLabel } from '../../lib/symbol-label'
import type { CodeSymbolDetail } from '../../types'

// The side panel of the Code page: what the picked symbol is, where it lives,
// a way to the editor, and its lines with the line of interest marked.

const props = defineProps<{
  symbol: CodeSymbolDetail
  isFocus: boolean
  // Absolute folder of the symbol's root on the server (for editor links).
  rootPath?: string | null
  // The line to mark in the code (a stack frame's line).
  markLine?: number | null
  focusName?: string | null
  // `code_graph.snippets` on the server.
  snippets?: boolean
}>()
defineEmits<{
  (e: 'make-focus'): void
  (e: 'back'): void
}>()

const { buildLink } = useIdeLink()

const label = computed(() => symbolLabel(props.symbol))
const absPath = computed(() => (props.rootPath ? `${props.rootPath.replace(/\/$/, '')}/${props.symbol.file}` : props.symbol.file))
const editorLink = computed(() => buildLink(absPath.value, props.markLine ?? props.symbol.line_start))

const lines = computed(() => {
  if (!props.symbol.source) return []
  const from = props.symbol.source_from ?? props.symbol.line_start
  return props.symbol.source.replace(/\n$/, '').split('\n').map((text, i) => ({ n: from + i, text }))
})

const relations = computed(() => props.symbol.relations.filter((r) => r.kind === 'extends' || r.kind === 'implements'))
</script>

<template>
  <aside
    class="cg-panel"
    aria-label="Symbol details"
  >
    <p class="cg-panel__eyebrow">
      {{ isFocus ? 'Focus' : 'Selected' }} · {{ symbol.kind }}
    </p>
    <h2 class="cg-panel__title">
      {{ symbol.fqn }}
    </h2>
    <p class="cg-panel__file">
      {{ symbol.file }}:{{ symbol.line_start }}–{{ symbol.line_end }}
    </p>
    <code
      v-if="symbol.signature"
      class="cg-panel__sig"
    >{{ symbol.signature }}</code>

    <div class="cg-panel__actions">
      <a
        v-if="editorLink"
        :href="editorLink"
        class="cg-panel__btn"
      >Open in editor</a>
      <button
        v-if="!isFocus"
        type="button"
        class="cg-panel__btn cg-panel__btn--primary"
        @click="$emit('make-focus')"
      >
        Make it the focus
      </button>
      <button
        v-if="!isFocus && focusName"
        type="button"
        class="cg-panel__btn"
        @click="$emit('back')"
      >
        Back to {{ focusName }}
      </button>
    </div>

    <dl class="cg-panel__facts">
      <div>
        <dt>Calls in</dt>
        <dd>
          {{ symbol.callers }}<span
            v-if="symbol.name_calls"
            class="cg-panel__guess"
          > + ≈{{ symbol.name_calls }} by name</span>
        </dd>
      </div>
      <div>
        <dt>Calls out</dt>
        <dd>{{ symbol.callees }}</dd>
      </div>
      <div v-if="symbol.parent">
        <dt>In</dt>
        <dd>{{ symbol.parent.fqn }}</dd>
      </div>
      <div
        v-for="r in relations"
        :key="r.kind + r.fqn"
      >
        <dt>{{ r.kind }}</dt>
        <dd>{{ r.fqn }}</dd>
      </div>
    </dl>

    <div
      v-if="lines.length"
      class="cg-panel__code"
      role="region"
      :aria-label="`Code of ${label.name}`"
      tabindex="0"
    >
      <div
        v-for="l in lines"
        :key="l.n"
        class="cg-panel__line"
        :class="{ 'cg-panel__line--mark': l.n === markLine }"
      >
        <span class="cg-panel__ln">{{ l.n }}</span><span class="cg-panel__text">{{ l.text }}</span>
      </div>
    </div>
    <p
      v-else-if="snippets"
      class="cg-panel__note"
    >
      The server could not read the lines of this file.
    </p>
    <p
      v-else
      class="cg-panel__note"
    >
      Code lines are off on this server (<code>code_graph.snippets</code>).
    </p>
  </aside>
</template>

<style lang="scss" scoped>
.cg-panel {
  --cg-hl-line: #fef3c7;
  --cg-warn: #b45309;

  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  font-size: 13px;
  overflow: auto;

  @apply text-gray-800 dark:text-gray-200;

  .dark & {
    --cg-hl-line: rgb(251 191 36 / 0.14);
    --cg-warn: #fbbf24;
  }
}

.cg-panel__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @apply text-gray-600 dark:text-gray-400;
}

.cg-panel__title {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
  word-break: break-all;
}

.cg-panel__file,
.cg-panel__sig {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  word-break: break-all;

  @apply text-gray-600 dark:text-gray-400;
}

.cg-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cg-panel__btn {
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  @apply border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.cg-panel__btn--primary {
  @apply bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:opacity-90;

  border-color: transparent;
}

.cg-panel__facts {
  display: grid;
  gap: 2px;
  font-size: 12px;
}

.cg-panel__facts div {
  display: flex;
  gap: 8px;
}

.cg-panel__facts dt {
  min-width: 72px;

  &::first-letter {
    text-transform: uppercase;
  }

  @apply text-gray-600 dark:text-gray-400;
}

.cg-panel__facts dd {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  word-break: break-all;
}

.cg-panel__guess {
  color: var(--cg-warn);
}

.cg-panel__code {
  max-height: 420px;
  overflow: auto;
  border-radius: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 17px;

  @apply bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700;
}

.cg-panel__line {
  display: flex;
  white-space: pre;
}

.cg-panel__line--mark {
  background: var(--cg-hl-line);
}

.cg-panel__ln {
  flex: none;
  width: 40px;
  padding-right: 8px;
  text-align: right;
  user-select: none;

  @apply text-gray-500;
}

.cg-panel__note {
  font-size: 12px;

  @apply text-gray-600 dark:text-gray-400;
}
</style>
