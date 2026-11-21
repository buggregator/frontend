<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { FocusNode } from '../../lib/focus-layout'
import { symbolLabel } from '../../lib/symbol-label'

// A node of the focus graph (#6573 A): call name, owner, and one line that
// says what is special about it (focus, guessed by name, outside the index).

const props = defineProps<{ data: FocusNode }>()

const label = computed(() => {
  const d = props.data.data
  if (props.data.role === 'more') return { name: `+${props.data.more} more`, owner: '' }
  return d ? symbolLabel(d) : { name: props.data.id, owner: '' }
})

const external = computed(() => !!props.data.data?.external || props.data.data?.kind === 'external')

const note = computed(() => {
  if (props.data.role === 'more') return props.data.column < 0 ? 'callers not shown · open' : 'callees not shown · open'
  if (external.value) return 'outside the index'
  if (props.data.guessed) return '≈ guessed by method name'
  if (props.data.calls > 1) return `${props.data.calls} calls`
  return null
})

const ariaLabel = computed(() => {
  const side = props.data.column < 0 ? 'caller' : props.data.column > 0 ? 'callee' : 'focus'
  return [label.value.name, label.value.owner, side, note.value].filter(Boolean).join(', ')
})
</script>

<template>
  <div
    class="tg-node cg-node"
    :class="{
      'cg-node--focus': data.role === 'focus',
      'cg-node--more': data.role === 'more',
      'tg-node--external': external,
      'cg-node--guess': data.guessed
    }"
    :aria-label="ariaLabel"
    role="button"
    tabindex="0"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="tg-handle"
    />
    <span
      v-if="data.role === 'focus'"
      class="cg-node__tag"
    >focus</span>
    <div class="tg-node__name">
      {{ label.name }}
    </div>
    <div
      v-if="label.owner"
      class="tg-node__meta"
    >
      {{ label.owner }}
    </div>
    <div
      v-if="note"
      class="tg-node__self"
      :class="{ 'cg-node__note--guess': data.guessed && !external }"
    >
      {{ note }}
    </div>
    <Handle
      type="source"
      :position="Position.Right"
      class="tg-handle"
    />
  </div>
</template>

<style scoped>
.cg-node {
  position: relative;
  width: 172px;
}

.cg-node--focus {
  border-width: 2px;
  border-color: var(--tg-edge-hi);
}

.cg-node--more {
  border-style: dashed;
}

.cg-node--guess {
  border-style: dashed;
}

.cg-node__tag {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tg-muted);
}

.cg-node__note--guess {
  color: var(--cg-warn);
}
</style>
