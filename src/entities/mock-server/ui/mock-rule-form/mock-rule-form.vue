<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { formatJson } from '../../lib/mock-format'
import { bodyBytes, MAX_BODY_BYTES } from '../../lib/mock-rule'
import { insertAt } from '../../lib/mock-template'
import { MOCK_METHODS, type MockRuleErrors, type MockRuleInput } from '../../types'
import MockTemplateHelpers from '../mock-template-helpers/mock-template-helpers.vue'
import MockTemplatePreview from '../mock-template-preview/mock-template-preview.vue'

type Props = {
  modelValue: MockRuleInput
  errors?: MockRuleErrors
  readOnly?: boolean
  projects?: string[]
  baseUrl: string
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  readOnly: false,
  projects: () => []
})

const emit = defineEmits<{ 'update:modelValue': [value: MockRuleInput] }>()

const STATUS_CHIPS = [200, 201, 204, 400, 401, 404, 422, 500, 502]

const patch = (part: Partial<MockRuleInput>) =>
  emit('update:modelValue', { ...props.modelValue, ...part })

// Header rows are edited as a list (a name may be typed in several steps);
// the rule keeps them as an object. The parent remounts the form (`key`) for
// another rule, so the rows start from the rule once.
const rows = ref<{ name: string; value: string }[]>(
  Object.entries(props.modelValue.headers).map(([name, value]) => ({ name, value }))
)

watch(
  rows,
  (list) => {
    const headers: Record<string, string> = {}
    list.forEach(({ name, value }) => {
      if (name || value) headers[name] = value
    })
    patch({ headers })
  },
  { deep: true }
)

const addHeader = () => rows.value.push({ name: '', value: '' })
const removeHeader = (i: number) => rows.value.splice(i, 1)

const numberField = (key: 'status' | 'delay_ms' | 'seed', raw: string) =>
  patch({ [key]: raw.trim() === '' ? Number.NaN : Number(raw) })

const bytes = computed(() => bodyBytes(props.modelValue.body))
const bytesText = computed(() =>
  bytes.value >= 1024 ? `${(bytes.value / 1024).toFixed(1)} KB` : `${bytes.value} B`
)
const formattedBody = computed(() => formatJson(props.modelValue.body))
const canFormat = computed(
  () => !!formattedBody.value && formattedBody.value !== props.modelValue.body
)

const projectOptions = computed(() => {
  const list = [...props.projects]
  if (props.modelValue.project && !list.includes(props.modelValue.project))
    list.push(props.modelValue.project)
  return list
})

const sampleUrl = computed(() => {
  const sample = (props.modelValue.path || '/')
    .replace(/\{[^}]+\}/g, '42')
    .replace(/\*$/, 'a/b.png')
  const method = props.modelValue.method === 'ANY' ? 'GET' : props.modelValue.method
  return `curl -X ${method} ${props.baseUrl}${sample.replace(/^\//, '')}`
})

const describedBy = (key: keyof MockRuleInput, hint?: string) =>
  props.errors[key] ? `mock-err-${key}` : hint

// A helper goes into the body where the cursor is (or over the selection).
const bodyField = ref<HTMLTextAreaElement | null>(null)
const insertIntoBody = async (snippet: string) => {
  const el = bodyField.value
  const { text, caret } = insertAt(props.modelValue.body, el?.selectionStart ?? null, el?.selectionEnd ?? null, snippet)
  patch({ body: text })
  await nextTick()
  el?.focus()
  el?.setSelectionRange(caret, caret)
}

const bodyKind = computed(() => {
  if (props.modelValue.template) return 'Template'
  return formattedBody.value ? 'JSON' : props.modelValue.body ? 'Plain text' : 'Empty'
})
</script>

<template>
  <div class="mock-rule-form">
    <div class="mock-rule-form__meta">
      <div class="mock-rule-form__field mock-rule-form__grow">
        <label
          class="mock-rule-form__label"
          for="mock-f-name"
        >Name <span class="mock-rule-form__hint">optional</span></label>
        <input
          id="mock-f-name"
          class="mock-rule-form__input"
          :value="modelValue.name"
          :placeholder="`${modelValue.method} ${modelValue.path}`"
          :readonly="readOnly"
          @input="patch({ name: ($event.target as HTMLInputElement).value })"
        >
      </div>
      <div class="mock-rule-form__field">
        <span
          id="mock-f-enabled-label"
          class="mock-rule-form__label"
        >Enabled</span>
        <button
          type="button"
          role="switch"
          class="mock-rule-form__switch"
          aria-labelledby="mock-f-enabled-label"
          :aria-checked="modelValue.enabled"
          :disabled="readOnly"
          @click="patch({ enabled: !modelValue.enabled })"
        >
          <span class="mock-rule-form__knob" />
          <span class="mock-rule-form__switch-text">{{ modelValue.enabled ? 'On' : 'Off' }}</span>
        </button>
      </div>
    </div>

    <fieldset class="mock-rule-form__section">
      <legend class="mock-rule-form__legend">
        When a request matches
      </legend>
      <div class="mock-rule-form__match">
        <div class="mock-rule-form__field">
          <label
            class="mock-rule-form__label"
            for="mock-f-method"
          >Method</label>
          <select
            id="mock-f-method"
            class="mock-rule-form__input mock-rule-form__mono"
            :value="modelValue.method"
            :disabled="readOnly"
            @change="
              patch({
                method: ($event.target as HTMLSelectElement).value as MockRuleInput['method']
              })
            "
          >
            <option
              v-for="m in MOCK_METHODS"
              :key="m"
              :value="m"
            >
              {{ m }}
            </option>
          </select>
        </div>
        <div class="mock-rule-form__field mock-rule-form__grow">
          <label
            class="mock-rule-form__label"
            for="mock-f-path"
          >Path</label>
          <div class="mock-rule-form__addon">
            <span class="mock-rule-form__addon-text">/mock</span>
            <input
              id="mock-f-path"
              class="mock-rule-form__input mock-rule-form__mono"
              :class="{ 'mock-rule-form__input--error': errors.path }"
              :value="modelValue.path"
              placeholder="/users/{id}"
              :readonly="readOnly"
              :aria-invalid="errors.path ? 'true' : undefined"
              :aria-describedby="describedBy('path', 'mock-hint-path')"
              spellcheck="false"
              autocomplete="off"
              @input="patch({ path: ($event.target as HTMLInputElement).value })"
            >
          </div>
          <p
            v-if="errors.path"
            id="mock-err-path"
            class="mock-rule-form__error"
          >
            ⚠ {{ errors.path }}
          </p>
          <p
            v-else
            id="mock-hint-path"
            class="mock-rule-form__hint"
          >
            <code>{id}</code> one segment · <code>*</code> at the end: the rest of the path · the
            query string is ignored
          </p>
        </div>
      </div>
      <div class="mock-rule-form__field">
        <label
          class="mock-rule-form__label"
          for="mock-f-project"
        >Project</label>
        <select
          id="mock-f-project"
          class="mock-rule-form__input"
          :value="modelValue.project"
          :disabled="readOnly"
          aria-describedby="mock-hint-project"
          @change="patch({ project: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">
            All projects
          </option>
          <option
            v-for="p in projectOptions"
            :key="p"
            :value="p"
          >
            {{ p }}
          </option>
        </select>
        <p
          id="mock-hint-project"
          class="mock-rule-form__hint"
        >
          Taken from the <code>X-Buggregator-Project</code> header or
          <code>http://mock:project@host</code>
        </p>
      </div>
    </fieldset>

    <fieldset class="mock-rule-form__section">
      <legend class="mock-rule-form__legend">
        Respond with
      </legend>
      <div class="mock-rule-form__match">
        <div class="mock-rule-form__field">
          <label
            class="mock-rule-form__label"
            for="mock-f-status"
          >Status</label>
          <input
            id="mock-f-status"
            class="mock-rule-form__input mock-rule-form__mono mock-rule-form__short"
            :class="{ 'mock-rule-form__input--error': errors.status }"
            :value="Number.isNaN(modelValue.status) ? '' : modelValue.status"
            inputmode="numeric"
            :readonly="readOnly"
            :aria-invalid="errors.status ? 'true' : undefined"
            :aria-describedby="describedBy('status')"
            @input="numberField('status', ($event.target as HTMLInputElement).value)"
          >
          <p
            v-if="errors.status"
            id="mock-err-status"
            class="mock-rule-form__error"
          >
            ⚠ {{ errors.status }}
          </p>
        </div>
        <div class="mock-rule-form__field">
          <label
            class="mock-rule-form__label"
            for="mock-f-delay"
          >Delay</label>
          <div class="mock-rule-form__addon mock-rule-form__addon--post">
            <input
              id="mock-f-delay"
              class="mock-rule-form__input mock-rule-form__mono mock-rule-form__short"
              :class="{ 'mock-rule-form__input--error': errors.delay_ms }"
              :value="Number.isNaN(modelValue.delay_ms) ? '' : modelValue.delay_ms"
              inputmode="numeric"
              :readonly="readOnly"
              :aria-invalid="errors.delay_ms ? 'true' : undefined"
              :aria-describedby="describedBy('delay_ms')"
              @input="numberField('delay_ms', ($event.target as HTMLInputElement).value)"
            >
            <span class="mock-rule-form__addon-text">ms</span>
          </div>
          <p
            v-if="errors.delay_ms"
            id="mock-err-delay_ms"
            class="mock-rule-form__error"
          >
            ⚠ {{ errors.delay_ms }}
          </p>
        </div>
      </div>
      <div
        v-if="!readOnly"
        class="mock-rule-form__chips"
        role="group"
        aria-label="Common status codes"
      >
        <button
          v-for="s in STATUS_CHIPS"
          :key="s"
          type="button"
          class="mock-rule-form__chip"
          :aria-pressed="modelValue.status === s"
          @click="patch({ status: s })"
        >
          {{ s }}
        </button>
      </div>

      <div class="mock-rule-form__field">
        <span class="mock-rule-form__label">Headers <span class="mock-rule-form__hint">{{ rows.length }}</span></span>
        <div
          v-for="(row, i) in rows"
          :key="i"
          class="mock-rule-form__header-row"
        >
          <input
            v-model="row.name"
            class="mock-rule-form__input mock-rule-form__mono"
            :class="{
              'mock-rule-form__input--error':
                errors.headers && (!row.name.trim() || /[\s:]/.test(row.name))
            }"
            placeholder="Header"
            :aria-label="`Header ${i + 1} name`"
            :readonly="readOnly"
            spellcheck="false"
          >
          <input
            v-model="row.value"
            class="mock-rule-form__input mock-rule-form__mono"
            placeholder="Value"
            :aria-label="`Header ${i + 1} value`"
            :readonly="readOnly"
            spellcheck="false"
          >
          <button
            v-if="!readOnly"
            type="button"
            class="mock-rule-form__icon"
            :aria-label="`Remove header ${row.name || i + 1}`"
            @click="removeHeader(i)"
          >
            ×
          </button>
        </div>
        <p
          v-if="errors.headers"
          id="mock-err-headers"
          class="mock-rule-form__error"
        >
          ⚠ {{ errors.headers }}
        </p>
        <button
          v-if="!readOnly"
          type="button"
          class="mock-rule-form__link"
          @click="addHeader"
        >
          + Add header
        </button>
        <p class="mock-rule-form__hint">
          Always added: <code>Content-Security-Policy: sandbox</code>,
          <code>X-Content-Type-Options: nosniff</code>
        </p>
      </div>

      <div class="mock-rule-form__template">
        <div class="mock-rule-form__field">
          <span
            id="mock-f-template-label"
            class="mock-rule-form__label"
          >Template</span>
          <button
            type="button"
            role="switch"
            class="mock-rule-form__switch"
            aria-labelledby="mock-f-template-label"
            aria-describedby="mock-hint-template"
            :aria-checked="modelValue.template"
            :disabled="readOnly"
            @click="patch({ template: !modelValue.template })"
          >
            <span class="mock-rule-form__knob" />
            <span class="mock-rule-form__switch-text">{{ modelValue.template ? 'On' : 'Off' }}</span>
          </button>
        </div>
        <div
          v-if="modelValue.template"
          class="mock-rule-form__field"
        >
          <label
            class="mock-rule-form__label"
            for="mock-f-seed"
          >Seed</label>
          <input
            id="mock-f-seed"
            class="mock-rule-form__input mock-rule-form__mono mock-rule-form__short"
            :class="{ 'mock-rule-form__input--error': errors.seed }"
            :value="Number.isNaN(modelValue.seed) ? '' : modelValue.seed"
            inputmode="numeric"
            :readonly="readOnly"
            :aria-invalid="errors.seed ? 'true' : undefined"
            :aria-describedby="describedBy('seed', 'mock-hint-seed')"
            @input="numberField('seed', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <p
          id="mock-hint-template"
          class="mock-rule-form__hint mock-rule-form__template-hint"
        >
          <template v-if="modelValue.template">
            Body and header values are Go templates, rendered for every request:
            <code v-pre>{{ path "id" }}</code>, <code v-pre>{{ fake "email" | json }}</code>.
          </template>
          <template v-else>
            Off: the body is sent as written. On: the body can use request values and fake data.
          </template>
        </p>
        <p
          v-if="modelValue.template && errors.seed"
          id="mock-err-seed"
          class="mock-rule-form__error mock-rule-form__template-hint"
        >
          ⚠ {{ errors.seed }}
        </p>
        <p
          v-else-if="modelValue.template"
          id="mock-hint-seed"
          class="mock-rule-form__hint mock-rule-form__template-hint"
        >
          Seed 0: new fake data on every request. Any other number: the same data every time.
        </p>
      </div>

      <div class="mock-rule-form__field">
        <div class="mock-rule-form__label">
          <label for="mock-f-body">Body</label>
          <button
            v-if="!readOnly && canFormat && !modelValue.template"
            type="button"
            class="mock-rule-form__link"
            @click="patch({ body: formattedBody || modelValue.body })"
          >
            Format JSON
          </button>
        </div>
        <textarea
          id="mock-f-body"
          ref="bodyField"
          class="mock-rule-form__input mock-rule-form__mono mock-rule-form__body"
          :class="{ 'mock-rule-form__input--error': errors.body }"
          :value="modelValue.body"
          rows="8"
          spellcheck="false"
          :readonly="readOnly"
          :aria-invalid="errors.body ? 'true' : undefined"
          :aria-describedby="describedBy('body', 'mock-hint-body')"
          @input="patch({ body: ($event.target as HTMLTextAreaElement).value })"
        />
        <p
          v-if="errors.body"
          id="mock-err-body"
          class="mock-rule-form__error"
        >
          ⚠ {{ errors.body }}
        </p>
        <p
          id="mock-hint-body"
          class="mock-rule-form__hint mock-rule-form__between"
        >
          <span>{{ bodyKind }}</span>
          <span :class="{ 'mock-rule-form__over': bytes > MAX_BODY_BYTES }">{{ bytesText }} / 1 MB</span>
        </p>
      </div>

      <template v-if="modelValue.template">
        <MockTemplateHelpers
          v-if="!readOnly"
          @insert="insertIntoBody"
        />
        <MockTemplatePreview :rule="modelValue" />
      </template>
    </fieldset>

    <div class="mock-rule-form__try">
      <span class="mock-rule-form__legend">Try it</span>
      <code class="mock-rule-form__try-code">{{ sampleUrl }}</code>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mock-rule-form {
  @apply flex flex-col gap-5;
}

.mock-rule-form__meta,
.mock-rule-form__match {
  @apply flex flex-wrap gap-3;
}

.mock-rule-form__grow {
  @apply flex-1 min-w-[12rem];
}

.mock-rule-form__section {
  @apply flex flex-col gap-3 min-w-0;
}

.mock-rule-form__legend {
  @apply mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300;
}

.mock-rule-form__field {
  @apply flex flex-col gap-1 min-w-0;
}

.mock-rule-form__label {
  @apply flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300;
}

.mock-rule-form__hint {
  @apply text-2xs font-normal text-gray-500 dark:text-gray-400;

  code {
    @apply font-mono;
  }
}

.mock-rule-form__between {
  @apply flex justify-between;
}

.mock-rule-form__over {
  @apply text-red-700 dark:text-red-400 font-semibold;
}

.mock-rule-form__input {
  @apply w-full h-8 px-2 rounded text-sm min-w-0;
  @apply bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100;
  @apply border border-gray-500;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  &:read-only:not(select),
  &:disabled {
    @apply bg-gray-100 dark:bg-gray-900 border-dashed text-gray-600 dark:text-gray-300;
  }

  @media (max-width: 639px) {
    @apply h-10 text-base;
  }
}

.mock-rule-form__input--error {
  @apply border-red-700 dark:border-red-400 ring-1 ring-red-700 dark:ring-red-400;
}

.mock-rule-form__mono {
  @apply font-mono text-xs;

  @media (max-width: 639px) {
    @apply text-base;
  }
}

.mock-rule-form__short {
  @apply w-24;
}

.mock-rule-form__body {
  @apply h-auto py-2 resize-y;
}

.mock-rule-form__addon {
  @apply flex items-stretch;

  .mock-rule-form__input {
    @apply rounded-l-none;
  }
}

.mock-rule-form__addon--post .mock-rule-form__input {
  @apply rounded-l rounded-r-none;
}

.mock-rule-form__addon-text {
  @apply flex items-center px-2 font-mono text-xs border border-gray-500;
  @apply bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;

  &:first-child {
    @apply rounded-l border-r-0;
  }

  &:last-child {
    @apply rounded-r border-l-0;
  }
}

.mock-rule-form__error {
  @apply text-xs text-red-700 dark:text-red-400;
}

.mock-rule-form__chips {
  @apply flex flex-wrap gap-1;
}

.mock-rule-form__chip {
  @apply h-7 px-2 rounded font-mono text-xs border border-gray-300 dark:border-gray-600;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5;

  &[aria-pressed='true'] {
    @apply border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400;
  }
}

.mock-rule-form__header-row {
  @apply grid gap-2;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
}

.mock-rule-form__icon {
  @apply w-8 h-8 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700;
}

.mock-rule-form__link {
  @apply self-start text-xs text-blue-700 dark:text-blue-400 hover:underline;
}

.mock-rule-form__switch {
  @apply inline-flex items-center gap-2 h-8 text-sm text-gray-800 dark:text-gray-100;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.mock-rule-form__knob {
  @apply relative w-7 h-4 rounded-full border border-gray-500 bg-gray-200 dark:bg-gray-700;

  &::after {
    content: '';
    @apply absolute top-px left-px w-3 h-3 rounded-full bg-white shadow transition-transform;
  }

  [aria-checked='true'] > & {
    @apply bg-blue-600 border-blue-600;

    &::after {
      @apply translate-x-3;
    }
  }
}

.mock-rule-form__template {
  @apply flex flex-wrap items-start gap-x-6 gap-y-1;
}

.mock-rule-form__template-hint {
  @apply basis-full;
}

.mock-rule-form__try {
  @apply flex items-center gap-3 p-2 rounded bg-gray-100 dark:bg-gray-900 min-w-0;

  .mock-rule-form__legend {
    @apply mb-0 shrink-0;
  }
}

.mock-rule-form__try-code {
  @apply font-mono text-xs text-gray-800 dark:text-gray-100 truncate;
}
</style>
