<script lang="ts" setup>
import { computed, ref, reactive } from 'vue'
import { useIdeLink } from '@/shared/lib/helpers/use-ide-link'
import { IconSvg } from '@/shared/ui'
import type { SentryFrame } from '../../types'

type Props = {
  frame: SentryFrame
  isOpen: boolean
}

type CodeSegment = {
  text: string
  varName?: string
  varValue?: string
}

const props = defineProps<Props>()
const isFrameOpen = ref(props.isOpen)
const { buildLink } = useIdeLink()

const ideLink = computed(() => buildLink(props.frame.filename, props.frame.lineno))

const hasBody = computed(() =>
  Boolean(props.frame.context_line || props.frame.post_context || props.frame.pre_context)
)

const hasVars = computed(() => props.frame.vars && Object.keys(props.frame.vars).length > 0)

// Floating tooltip state
const tooltip = reactive({
  visible: false,
  content: '',
  x: 0,
  y: 0
})

let hideTimer: ReturnType<typeof setTimeout> | null = null

const showTooltip = (event: MouseEvent, value: string) => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltip.x = rect.left
  tooltip.y = rect.top - 4
  tooltip.content = value
  tooltip.visible = true
}

const hideTooltip = () => {
  hideTimer = setTimeout(() => {
    tooltip.visible = false
  }, 100)
}

const tooltipMouseEnter = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const tooltipMouseLeave = () => {
  tooltip.visible = false
}

const formatVarValue = (value: unknown): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value.length > 300 ? value.slice(0, 300) + '…' : value
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value, null, 2)
      return json.length > 500 ? json.slice(0, 500) + '…' : json
    } catch {
      return String(value)
    }
  }
  return String(value)
}

// Build a regex that matches any variable name from vars
const varPattern = computed(() => {
  if (!props.frame.vars) return null
  const keys = Object.keys(props.frame.vars)
  if (keys.length === 0) return null

  const escaped = keys
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  return new RegExp(`(\\$(?:${escaped.join('|')})|(?:${escaped.join('|')}))(?=\\b|[^\\w])`, 'g')
})

const parseCodeLine = (line: string): CodeSegment[] => {
  if (!hasVars.value || !varPattern.value || !line) {
    return [{ text: line || '' }]
  }

  const segments: CodeSegment[] = []
  const regex = new RegExp(varPattern.value.source, varPattern.value.flags)
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    const matchedText = match[0]
    const lookupKey = matchedText.startsWith('$') ? matchedText.slice(1) : matchedText
    const vars = props.frame.vars!

    const varValue =
      vars[lookupKey] !== undefined
        ? vars[lookupKey]
        : vars[matchedText] !== undefined
          ? vars[matchedText]
          : undefined

    if (varValue === undefined) {
      continue
    }

    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) })
    }

    segments.push({
      text: matchedText,
      varName: matchedText,
      varValue: formatVarValue(varValue)
    })

    lastIndex = match.index + matchedText.length
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) })
  }

  if (segments.length === 0) {
    return [{ text: line }]
  }

  return segments
}

const toggleOpen = () => {
  if (hasBody.value || hasVars.value) {
    isFrameOpen.value = !isFrameOpen.value
  }
}
</script>

<template>
  <div
    class="frame"
    :class="{ 'frame--empty': !hasBody && !hasVars }"
  >
    <div
      class="frame__head"
      @click="toggleOpen"
    >
      <div class="frame__title">
        <a
          v-if="ideLink"
          :href="ideLink"
          class="frame__fn frame__fn--link"
          @click.stop
        >{{
          frame.filename
        }}</a>
        <span
          v-else
          class="frame__fn"
        >{{ frame.filename }}</span>
        <span
          v-if="frame.function"
          class="frame__meta"
        >
          in {{ frame.function }} at line {{ frame.lineno
          }}{{ frame.colno ? ':' + frame.colno : '' }}
        </span>
      </div>

      <div class="frame__head-right">
        <span
          v-if="hasVars"
          class="frame__vars-hint"
        >{{ Object.keys(frame.vars!).length }} vars</span>

        <IconSvg
          v-if="hasBody || hasVars"
          class="frame__chevron"
          :class="{ 'frame__chevron--open': isFrameOpen }"
          name="collapsed"
        />
      </div>
    </div>

    <div
      v-if="isFrameOpen && hasBody"
      class="frame__body"
    >
      <template v-if="frame.pre_context">
        <div
          v-for="(line, i) in frame.pre_context"
          :key="i"
          class="frame__line"
        >
          <span class="frame__line-num">{{
            (frame?.lineno ?? 0) - (frame.pre_context.length - i)
          }}</span>
          <pre class="frame__line-code"><template
              v-for="(seg, si) in parseCodeLine(line)"
              :key="si"
            ><span
                v-if="seg.varName"
                class="frame__line-var"
                @mouseenter="showTooltip($event, seg.varValue!)"
                @mouseleave="hideTooltip"
          >{{ seg.text }}</span><template v-else>{{ seg.text }}</template></template></pre>
        </div>
      </template>

      <div
        v-if="frame.context_line"
        class="frame__line frame__line--active"
      >
        <span class="frame__line-num">{{ frame.lineno }}</span>
        <pre class="frame__line-code"><template
            v-for="(seg, si) in parseCodeLine(frame.context_line)"
            :key="si"
          ><span
              v-if="seg.varName"
              class="frame__line-var"
              @mouseenter="showTooltip($event, seg.varValue!)"
              @mouseleave="hideTooltip"
        >{{ seg.text }}</span><template v-else>{{ seg.text }}</template></template></pre>
      </div>

      <template v-if="frame.post_context">
        <div
          v-for="(line, i) in frame.post_context"
          :key="i"
          class="frame__line"
        >
          <span class="frame__line-num">{{ (frame?.lineno ?? 0) + i + 1 }}</span>
          <pre class="frame__line-code"><template
              v-for="(seg, si) in parseCodeLine(line)"
              :key="si"
            ><span
                v-if="seg.varName"
                class="frame__line-var"
                @mouseenter="showTooltip($event, seg.varValue!)"
                @mouseleave="hideTooltip"
          >{{ seg.text }}</span><template v-else>{{ seg.text }}</template></template></pre>
        </div>
      </template>
    </div>

    <!-- Fixed-position tooltip (teleported outside overflow) -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="frame-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        @mouseenter="tooltipMouseEnter"
        @mouseleave="tooltipMouseLeave"
      >
        <pre class="frame-tooltip__content">{{ tooltip.content }}</pre>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.frame {
  @apply text-xs;
  @apply border-b border-gray-200 dark:border-gray-700;

  &:last-child {
    @apply border-b-0;
  }
}

.frame__head {
  @apply py-2 px-3 flex justify-between items-start gap-2 cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-800/50;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;

  .frame--empty & {
    @apply cursor-default;
  }
}

.frame__head-right {
  @apply flex items-center gap-2 flex-shrink-0;
}

.frame__title {
  @apply flex flex-col gap-0.5;
}

.frame__fn {
  @apply font-semibold text-gray-800 dark:text-gray-200 break-all;
}

.frame__fn--link {
  @apply text-blue-600 dark:text-blue-400 hover:underline cursor-pointer;
}

.frame__meta {
  @apply text-gray-400 dark:text-gray-500 text-2xs;
}

.frame__vars-hint {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500;
}

.frame__chevron {
  @apply w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500;
  transition: transform 0.15s ease;
}

.frame__chevron--open {
  transform: rotate(180deg);
}

.frame__body {
  @apply bg-gray-900 p-2 overflow-x-auto font-mono;
}

.frame__line {
  @apply flex text-gray-400;
}

.frame__line--active {
  @apply bg-blue-900/50 text-gray-100;
}

.frame__line-num {
  @apply w-10 text-right pr-3 select-none text-gray-600 flex-shrink-0;
}

.frame__line-code {
  @apply flex-1;
}

/* Inline variable highlight */
.frame__line-var {
  @apply cursor-default;
  @apply text-amber-300;
  border-bottom: 1px dashed rgba(251, 191, 36, 0.4);

  &:hover {
    @apply bg-amber-500/20;
  }
}
</style>

<!-- Global styles for teleported tooltip -->
<style lang="scss">
.frame-tooltip {
  position: fixed;
  z-index: 9999;
  transform: translateY(-100%);
  min-width: 180px;
  max-width: 420px;
  max-height: 280px;
  overflow: auto;
  border-radius: 6px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid theme('colors.gray.600');
  background: theme('colors.gray.800');
  pointer-events: auto;
}

.frame-tooltip__content {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-all;
  color: theme('colors.gray.200');
}
</style>
