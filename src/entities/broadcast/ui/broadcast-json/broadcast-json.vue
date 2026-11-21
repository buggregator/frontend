<script lang="ts" setup>
import { computed } from 'vue'
import { jsonLines } from '../../lib/json-lines'
import type { PayloadChange } from '../../lib/payload-diff'

// Pretty JSON with each changed line marked `~` and its old value, a new one
// `+` (#6614). The mark is a sign and words, not only the highlight.
type Props = {
  value: unknown
  changes?: PayloadChange[]
  label?: string
}

const props = withDefaults(defineProps<Props>(), { changes: () => [], label: 'Payload' })

const lines = computed(() => jsonLines(props.value, props.changes))
</script>

<template>
  <div
    class="bc-json"
    role="region"
    :aria-label="label"
    tabindex="0"
  >
    <div
      v-for="(line, i) in lines"
      :key="i"
      class="bc-json__line"
      :class="{ 'bc-json__line--chg': line.mark === '~', 'bc-json__line--add': line.mark === '+' }"
    >
      <span
        class="bc-json__mark"
        aria-hidden="true"
      >{{ line.mark }}</span>
      <span class="bc-json__text"><span class="bc-json__indent">{{ '  '.repeat(line.indent) }}</span><span
        v-for="(t, j) in line.tokens"
        :key="j"
        :class="`bc-json__${t.kind}`"
      >{{ t.text }}</span><span
        v-if="line.mark === '~'"
        class="bc-json__was"
      >was <s>{{ line.was }}</s></span><span
        v-else-if="line.mark === '+'"
        class="bc-json__was"
      >new</span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bc-json {
  @apply font-mono rounded border overflow-auto py-2;
  @apply bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700;
  font-size: 12px;
  line-height: 1.65;
  max-height: 420px;
  color: var(--bc-key);

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: 2px;
  }
}

.bc-json__line {
  @apply flex pr-3;
}

.bc-json__mark {
  @apply flex-none text-center font-bold;
  width: 22px;
}

.bc-json__text {
  white-space: pre;
}

.bc-json__line--chg {
  background: var(--bc-chg);

  .bc-json__mark {
    color: var(--bc-chg-mark);
  }
}

.bc-json__line--add {
  background: var(--bc-add);

  .bc-json__mark {
    color: var(--bc-add-mark);
  }
}

.bc-json__key {
  color: var(--bc-key);
}

.bc-json__str {
  color: var(--bc-str);
}

.bc-json__num {
  color: var(--bc-num);
}

.bc-json__null {
  color: var(--bc-null);
  font-weight: 600;
}

.bc-json__punct {
  color: var(--bc-punct);
}

.bc-json__was {
  @apply font-sans ml-3 text-gray-600 dark:text-gray-400;
  font-size: 11px;

  s {
    @apply font-mono;
  }
}
</style>
