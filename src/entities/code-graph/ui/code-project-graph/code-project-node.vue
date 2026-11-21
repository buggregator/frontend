<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { ProjectNode } from '../../lib/project-layout'
import { symbolLabel } from '../../lib/symbol-label'

// A box of the whole graph: a namespace, package or class opens on click; a
// function or method opens the focus view.

const props = defineProps<{ data: ProjectNode; matches?: number }>()

const KIND: Record<string, string> = {
  folder: 'folder',
  namespace: 'namespace',
  package: 'package',
  class: 'class',
  interface: 'interface',
  trait: 'trait',
  enum: 'enum',
  struct: 'struct',
  type: 'type',
  function: 'function',
  method: 'method',
  external: 'outside the index',
  file: 'file'
}

const label = computed(() => {
  const n = props.data.node
  if (n.kind === 'namespace' || n.kind === 'package' || n.kind === 'folder') {
    // PHP App\Http → Http, owner App; Go …/internal/event → event, owner …/internal.
    const fqn = n.fqn || n.name || '(root)'
    const cut = Math.max(fqn.lastIndexOf('\\'), fqn.lastIndexOf('/'))
    return { name: cut >= 0 ? fqn.slice(cut + 1) : fqn, owner: cut >= 0 ? fqn.slice(0, cut) : '' }
  }
  return symbolLabel(n)
})

const kind = computed(() => KIND[props.data.node.kind] ?? props.data.node.kind)

// One short line: what is inside, calls in and out (zeros left out).
const meta = computed(() => {
  const n = props.data.node
  const { callsIn, callsOut } = props.data
  const parts: string[] = []
  if (props.data.expandable && n.size) parts.push(`${n.size} inside`)
  if (callsIn) parts.push(`${callsIn} in`)
  if (callsOut) parts.push(`${callsOut} out`)
  return parts.length ? parts.join(' · ') : 'no calls'
})

const action = computed(() => (props.data.expandable ? 'open' : props.data.callable ? 'focus' : null))

const ariaLabel = computed(() =>
  [
    label.value.name,
    label.value.owner,
    kind.value,
    meta.value,
    props.matches ? `${props.matches} found` : null,
    action.value === 'open' ? 'press Enter to open' : action.value === 'focus' ? 'press Enter to see its calls' : null
  ]
    .filter(Boolean)
    .join(', ')
)
</script>

<template>
  <div
    class="tg-node cg-pnode"
    :class="{
      'tg-node--external': data.node.external || data.node.kind === 'external',
      'cg-pnode--open': data.expandable,
      'cg-pnode--found': !!matches
    }"
    :aria-label="ariaLabel"
    :role="action ? 'button' : undefined"
    :tabindex="action ? 0 : undefined"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="tg-handle"
    />
    <span
      v-if="matches"
      class="cg-pnode__found"
    >{{ matches }} found</span>
    <span
      class="cg-pnode__kind"
      aria-hidden="true"
    >{{ kind }}</span>
    <div
      class="tg-node__name"
      :title="data.node.fqn"
    >
      {{ label.name }}
    </div>
    <div
      v-if="label.owner"
      class="tg-node__meta cg-pnode__owner"
    >
      {{ label.owner }}
    </div>
    <div class="tg-node__self">
      {{ meta }}
    </div>
    <Handle
      type="source"
      :position="Position.Right"
      class="tg-handle"
    />
  </div>
</template>

<style scoped>
.cg-pnode {
  position: relative;
  width: 200px;
}

.cg-pnode--open {
  cursor: zoom-in;
}

.cg-pnode--found {
  border-width: 2px;
  border-color: var(--tg-edge-hi);
}

.cg-pnode__kind {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tg-muted);
}

.cg-pnode .tg-node__name {
  padding-right: 64px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cg-pnode__owner {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cg-pnode__found {
  position: absolute;
  top: -10px;
  right: 8px;
  padding: 0 6px;
  border-radius: 3px;
  background: var(--tg-edge-hi);
  color: #fff;
  font-size: 10px;
  line-height: 18px;
}
</style>
