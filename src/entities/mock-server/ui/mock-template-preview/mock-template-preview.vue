<script lang="ts" setup>
import { computed, toRef } from 'vue'
import { formatJson } from '../../lib/mock-format'
import { useMockPreview } from '../../lib/use-mock-template'
import { MOCK_METHODS, type MockRuleInput } from '../../types'
import MockBadge from '../mock-badge/mock-badge.vue'

type Props = { rule: MockRuleInput }
const props = defineProps<Props>()

const { sample, result, problem, pending, run } = useMockPreview(toRef(props, 'rule'))

const methods = MOCK_METHODS.filter((m) => m !== 'ANY')
const shownBody = computed(() => (result.value ? formatJson(result.value.body) || result.value.body : ''))
const headerList = computed(() => Object.entries(result.value?.headers || {}))
</script>

<template>
  <section
    class="mock-preview"
    aria-labelledby="mock-preview-title"
  >
    <div class="mock-preview__bar">
      <h4
        id="mock-preview-title"
        class="mock-preview__title"
      >
        Preview
      </h4>
      <span class="mock-preview__hint">Not saved · fake data changes on every run unless a seed is set</span>
    </div>

    <div class="mock-preview__request">
      <div class="mock-preview__line">
        <select
          v-model="sample.method"
          class="mock-preview__input mock-preview__method"
          aria-label="Sample request method"
        >
          <option
            v-for="m in methods"
            :key="m"
            :value="m"
          >
            {{ m }}
          </option>
        </select>
        <div class="mock-preview__addon">
          <span class="mock-preview__addon-text">/mock</span>
          <input
            v-model="sample.path"
            class="mock-preview__input"
            aria-label="Sample request path with query"
            placeholder="/users/42?page=2"
            spellcheck="false"
            autocomplete="off"
          >
        </div>
        <button
          type="button"
          class="mock-preview__run"
          :disabled="pending"
          @click="run"
        >
          {{ pending ? 'Running…' : result || problem ? 'Run again' : 'Run preview' }}
        </button>
      </div>
      <details class="mock-preview__more">
        <summary>Request headers and body</summary>
        <div class="mock-preview__more-body">
          <label
            class="mock-preview__label"
            for="mock-preview-headers"
          >Headers <span class="mock-preview__hint">one per line, Name: value</span></label>
          <textarea
            id="mock-preview-headers"
            v-model="sample.headers"
            class="mock-preview__input mock-preview__area"
            rows="2"
            spellcheck="false"
            placeholder="X-Request-Id: abc"
          />
          <label
            class="mock-preview__label"
            for="mock-preview-body"
          >Body</label>
          <textarea
            id="mock-preview-body"
            v-model="sample.body"
            class="mock-preview__input mock-preview__area"
            rows="3"
            spellcheck="false"
            placeholder="{&quot;user&quot;: {&quot;email&quot;: &quot;jane@example.com&quot;}}"
          />
        </div>
      </details>
    </div>

    <div
      class="mock-preview__out"
      aria-live="polite"
      :aria-busy="pending"
    >
      <p
        v-if="problem"
        class="mock-preview__error"
        role="alert"
      >
        ⚠ {{ problem }}
      </p>
      <template v-else-if="result">
        <div class="mock-preview__status">
          <MockBadge :status="result.status" />
          <span
            v-if="!result.matched"
            class="mock-preview__warn"
          >This request would not hit the rule (method or path differ)</span>
        </div>
        <p
          v-if="result.error"
          class="mock-preview__error"
          role="alert"
        >
          ⚠ {{ result.error }}
        </p>
        <dl
          v-if="headerList.length"
          class="mock-preview__headers"
        >
          <template
            v-for="[k, v] in headerList"
            :key="k"
          >
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </template>
        </dl>
        <pre
          v-if="shownBody"
          class="mock-preview__body"
        >{{ shownBody }}</pre>
        <p
          v-else-if="!result.error"
          class="mock-preview__hint"
        >
          Empty body
        </p>
      </template>
      <p
        v-else
        class="mock-preview__hint"
      >
        Run the preview to see what this rule answers. It updates as you edit.
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.mock-preview {
  @apply flex flex-col gap-2 p-3 rounded border border-gray-300 dark:border-gray-600 min-w-0;
}

.mock-preview__bar {
  @apply flex flex-wrap items-baseline gap-x-3 gap-y-1;
}

.mock-preview__title {
  @apply text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300;
}

.mock-preview__hint,
.mock-preview__label {
  @apply text-2xs text-gray-500 dark:text-gray-400;
}

.mock-preview__label {
  @apply text-xs font-medium text-gray-600 dark:text-gray-300;
}

.mock-preview__line {
  @apply flex flex-wrap gap-2;
}

.mock-preview__input {
  @apply w-full h-8 px-2 rounded font-mono text-xs min-w-0;
  @apply bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-500;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  @media (max-width: 639px) {
    @apply h-10 text-base;
  }
}

.mock-preview__method {
  @apply w-auto;
}

.mock-preview__area {
  @apply h-auto py-1 resize-y;
}

.mock-preview__addon {
  @apply flex flex-1 min-w-[12rem] items-stretch;

  .mock-preview__input {
    @apply rounded-l-none;
  }
}

.mock-preview__addon-text {
  @apply flex items-center px-2 font-mono text-xs border border-r-0 border-gray-500 rounded-l;
  @apply bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
}

.mock-preview__run {
  @apply h-8 px-3 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700;
  @apply disabled:opacity-60 disabled:cursor-wait;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500;

  @media (max-width: 639px) {
    @apply h-10;
  }
}

.mock-preview__more summary {
  @apply cursor-pointer text-xs text-gray-600 dark:text-gray-300;
}

.mock-preview__more-body {
  @apply flex flex-col gap-1 mt-2;
}

.mock-preview__out {
  @apply flex flex-col gap-2 min-w-0;
}

.mock-preview__status {
  @apply flex flex-wrap items-center gap-2;
}

.mock-preview__warn {
  @apply text-xs text-amber-700 dark:text-amber-400;
}

.mock-preview__error {
  @apply text-xs text-red-700 dark:text-red-400 [overflow-wrap:anywhere];
}

.mock-preview__headers {
  @apply grid gap-x-3 gap-y-0.5 font-mono text-2xs;
  grid-template-columns: auto minmax(0, 1fr);

  dt {
    @apply text-gray-500 dark:text-gray-400;
  }

  dd {
    @apply text-gray-800 dark:text-gray-100 [overflow-wrap:anywhere];
  }
}

.mock-preview__body {
  @apply p-2 rounded bg-gray-50 dark:bg-gray-900 font-mono text-xs text-gray-800 dark:text-gray-100;
  @apply max-h-72 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere];
}
</style>
