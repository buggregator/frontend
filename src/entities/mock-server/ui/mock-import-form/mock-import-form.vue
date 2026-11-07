<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { buildImport, emptyImportDraft } from '../../lib/mock-openapi'
import type { MockOpenAPIErrors, MockOpenAPIImport, MockOpenAPIResult } from '../../types'

type Props = {
  projects?: string[]
  // editable rules per existing group: a re-import replaces them
  groups?: Map<string, number>
  errors?: MockOpenAPIErrors
  busy?: boolean
  result?: MockOpenAPIResult | null
}

const props = withDefaults(defineProps<Props>(), {
  projects: () => [],
  groups: () => new Map(),
  errors: () => ({}),
  busy: false,
  result: null
})

// The page owns the footer: its submit button points at this form by id.
const emit = defineEmits<{ submit: [input: MockOpenAPIImport] }>()

// The server takes up to 5 MB of spec text.
const MAX_SPEC_BYTES = 5 * 1024 * 1024

const draft = ref(emptyImportDraft())
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Set when Import is pressed with nothing to import; cleared by typing.
const missing = ref(false)
watch(
  () => [draft.value.spec, draft.value.url, draft.value.source],
  () => (missing.value = false)
)

const specError = computed(
  () =>
    fileError.value ||
    props.errors.spec ||
    (missing.value && draft.value.source === 'paste' ? 'Paste a spec or load a file.' : '')
)
const urlError = computed(
  () =>
    props.errors.url ||
    props.errors.spec ||
    (missing.value && draft.value.source === 'url' ? 'Enter the spec URL.' : '')
)
const form = ref<HTMLFormElement | null>(null)
const groupNames = computed(() => [...props.groups.keys()])
const replaces = computed(() => props.groups.get(draft.value.group.trim()) || 0)
const canSubmit = computed(() =>
  draft.value.source === 'url' ? !!draft.value.url.trim() : !!draft.value.spec.trim()
)

const pickFile = () => fileInput.value?.click()

const readFile = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > MAX_SPEC_BYTES) {
    fileError.value = `${file.name} is larger than 5 MB.`
    return
  }
  fileError.value = ''
  draft.value.spec = await file.text()
}

const submit = async () => {
  if (props.busy) return
  if (!canSubmit.value) {
    missing.value = true
    await nextTick()
    // focus reads the message out (aria-describedby)
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  emit('submit', buildImport(draft.value))
}
</script>

<template>
  <div
    v-if="result"
    class="mock-import"
  >
    <p
      class="mock-import__done"
      role="status"
    >
      Imported <b>{{ result.rules.length }} {{ result.rules.length === 1 ? 'rule' : 'rules' }}</b>
      from <b>{{ result.title || 'the spec' }}</b> into group <code>{{ result.group }}</code>. They
      run after your other rules.
    </p>
    <div
      v-if="result.skipped.length"
      class="mock-import__section"
    >
      <h3 class="mock-import__legend">
        Skipped {{ result.skipped.length }}
      </h3>
      <ul class="mock-import__skipped">
        <li
          v-for="s in result.skipped"
          :key="`${s.method} ${s.path}`"
        >
          <code>{{ s.method }} {{ s.path }}</code>
          <span>{{ s.reason }}</span>
        </li>
      </ul>
    </div>
  </div>

  <form
    v-else
    id="mock-import-form"
    ref="form"
    class="mock-import"
    novalidate
    @submit.prevent="submit"
  >
    <p class="mock-import__hint">
      One rule per operation of an OpenAPI 3.0 or 3.1 spec, YAML or JSON. Bodies come from the
      spec's examples, or from its schemas as templates with fake data.
    </p>

    <fieldset class="mock-import__section">
      <legend class="mock-import__legend">
        Spec
      </legend>
      <div
        class="mock-import__tabs"
        role="group"
        aria-label="Spec source"
      >
        <button
          type="button"
          class="mock-import__tab"
          :aria-pressed="draft.source === 'paste'"
          @click="draft.source = 'paste'"
        >
          Paste or file
        </button>
        <button
          type="button"
          class="mock-import__tab"
          :aria-pressed="draft.source === 'url'"
          @click="draft.source = 'url'"
        >
          URL
        </button>
      </div>

      <div
        v-if="draft.source === 'paste'"
        class="mock-import__field"
      >
        <div class="mock-import__between">
          <label
            class="mock-import__label"
            for="mock-i-spec"
          >Spec text</label>
          <button
            type="button"
            class="mock-import__link"
            @click="pickFile"
          >
            Load a file…
          </button>
          <input
            ref="fileInput"
            type="file"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            accept=".yaml,.yml,.json,application/json,application/yaml,text/yaml"
            @change="readFile"
          >
        </div>
        <textarea
          id="mock-i-spec"
          v-model="draft.spec"
          class="mock-import__input mock-import__mono mock-import__spec"
          :class="{ 'mock-import__input--error': specError }"
          rows="12"
          spellcheck="false"
          placeholder="openapi: 3.0.3&#10;info:&#10;  title: Shop API&#10;paths:&#10;  /users/{id}: …"
          :aria-invalid="!!specError"
          :aria-describedby="specError ? 'mock-i-spec-err' : undefined"
        />
        <p
          v-if="specError"
          id="mock-i-spec-err"
          class="mock-import__error"
        >
          {{ specError }}
        </p>
      </div>

      <div
        v-else
        class="mock-import__field"
      >
        <label
          class="mock-import__label"
          for="mock-i-url"
        >Spec URL <span class="mock-import__hint">http or https, up to 5 MB</span></label>
        <input
          id="mock-i-url"
          v-model="draft.url"
          type="url"
          inputmode="url"
          class="mock-import__input mock-import__mono"
          :class="{ 'mock-import__input--error': urlError }"
          placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
          :aria-invalid="!!urlError"
          :aria-describedby="urlError ? 'mock-i-url-err' : undefined"
        >
        <p
          v-if="urlError"
          id="mock-i-url-err"
          class="mock-import__error"
        >
          {{ urlError }}
        </p>
      </div>
    </fieldset>

    <fieldset class="mock-import__section">
      <legend class="mock-import__legend">
        Rules
      </legend>
      <div class="mock-import__row">
        <div class="mock-import__field">
          <label
            class="mock-import__label"
            for="mock-i-project"
          >Project</label>
          <select
            id="mock-i-project"
            v-model="draft.project"
            class="mock-import__input"
            :class="{ 'mock-import__input--error': errors.project }"
            :aria-invalid="!!errors.project"
            :aria-describedby="errors.project ? 'mock-i-project-err' : undefined"
          >
            <option value="">
              Every project
            </option>
            <option
              v-for="p in projects"
              :key="p"
              :value="p"
            >
              {{ p }}
            </option>
          </select>
        </div>
        <div class="mock-import__field mock-import__grow">
          <label
            class="mock-import__label"
            for="mock-i-group"
          >Group</label>
          <input
            id="mock-i-group"
            v-model="draft.group"
            type="text"
            list="mock-i-groups"
            class="mock-import__input mock-import__mono"
            :class="{ 'mock-import__input--error': errors.group }"
            :aria-invalid="!!errors.group"
            :aria-describedby="
              ['mock-i-group-hint', errors.group && 'mock-i-group-err', replaces && 'mock-i-group-warn']
                .filter(Boolean)
                .join(' ') || undefined
            "
          >
          <span
            id="mock-i-group-hint"
            class="mock-import__hint"
          >Empty = openapi:&lt;title of the spec&gt;</span>
          <datalist id="mock-i-groups">
            <option
              v-for="g in groupNames"
              :key="g"
              :value="g"
            />
          </datalist>
        </div>
      </div>
      <p
        v-if="errors.project"
        id="mock-i-project-err"
        class="mock-import__error"
      >
        {{ errors.project }}
      </p>
      <p
        v-if="errors.group"
        id="mock-i-group-err"
        class="mock-import__error"
      >
        {{ errors.group }}
      </p>
      <p
        v-if="replaces"
        id="mock-i-group-warn"
        class="mock-import__warn"
      >
        Group <code>{{ draft.group.trim() }}</code> has {{ replaces }}
        {{ replaces === 1 ? 'rule' : 'rules' }}. The import replaces
        {{ replaces === 1 ? 'it' : 'them' }}: changes you made there are lost.
      </p>
      <p
        v-else
        class="mock-import__hint"
      >
        Importing into a group that exists replaces its rules.
      </p>

      <div class="mock-import__field">
        <label class="mock-import__check">
          <input
            v-model="draft.fromServers"
            type="checkbox"
          >
          <span>Put the path of the spec's <code>servers[0].url</code> in front of every
            path</span>
        </label>
      </div>
      <div
        v-if="!draft.fromServers"
        class="mock-import__field"
      >
        <label
          class="mock-import__label"
          for="mock-i-base"
        >Base path <span class="mock-import__hint">empty = paths as in the spec</span></label>
        <input
          id="mock-i-base"
          v-model="draft.basePath"
          type="text"
          class="mock-import__input mock-import__mono"
          :class="{ 'mock-import__input--error': errors.base_path }"
          placeholder="/api/v1"
          :aria-invalid="!!errors.base_path"
          :aria-describedby="errors.base_path ? 'mock-i-base-err' : undefined"
        >
        <p
          v-if="errors.base_path"
          id="mock-i-base-err"
          class="mock-import__error"
        >
          {{ errors.base_path }}
        </p>
      </div>
    </fieldset>
  </form>
</template>

<style lang="scss" scoped>
.mock-import {
  @apply flex flex-col gap-5;
}

.mock-import__section {
  @apply flex flex-col gap-3 min-w-0;
}

.mock-import__legend {
  @apply mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300;
}

.mock-import__tabs {
  @apply flex gap-1 border-b border-gray-300 dark:border-gray-600;
}

.mock-import__tab {
  @apply h-8 px-3 text-xs font-medium rounded-t border-b-2 border-transparent;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  &[aria-pressed='true'] {
    @apply border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400;
  }

  @media (max-width: 639px) {
    @apply h-11;
  }
}

.mock-import__row {
  @apply flex flex-col sm:flex-row sm:flex-wrap gap-3;
}

.mock-import__grow {
  @apply sm:flex-1 sm:min-w-[12rem];
}

.mock-import__field {
  @apply flex flex-col gap-1 min-w-0;
}

.mock-import__between {
  @apply flex items-center justify-between gap-2;
}

.mock-import__label {
  @apply flex flex-wrap items-center gap-x-2 text-xs font-medium text-gray-600 dark:text-gray-300;
}

.mock-import__hint {
  @apply text-2xs font-normal text-gray-500 dark:text-gray-400;

  code {
    @apply font-mono;
  }
}

.mock-import__check {
  @apply flex items-start gap-2 text-xs text-gray-700 dark:text-gray-200;

  input {
    @apply mt-0.5 shrink-0;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;
  }

  @media (max-width: 639px) {
    @apply min-h-11 items-center;

    input {
      @apply mt-0 w-5 h-5;
    }
  }

  code {
    @apply font-mono;
  }
}

.mock-import__input {
  @apply w-full h-8 px-2 rounded text-sm min-w-0;
  @apply bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100;
  @apply border border-gray-500;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  @media (max-width: 639px) {
    @apply h-10 text-base;
  }
}

.mock-import__input--error {
  @apply border-red-700 dark:border-red-400 ring-1 ring-red-700 dark:ring-red-400;
}

.mock-import__mono {
  @apply font-mono text-xs;

  @media (max-width: 639px) {
    @apply text-base;
  }
}

.mock-import__spec {
  @apply h-auto py-2 resize-y;
}

.mock-import__error {
  @apply text-xs text-red-700 dark:text-red-400;
}

.mock-import__warn {
  @apply text-xs text-amber-800 dark:text-amber-300;

  code {
    @apply font-mono;
  }
}

.mock-import__link {
  @apply text-xs text-blue-700 dark:text-blue-400 underline underline-offset-2;

  @media (max-width: 639px) {
    @apply inline-flex items-center min-h-11 px-2 -mr-2;
  }

  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;
}

.mock-import__done {
  @apply text-sm text-gray-800 dark:text-gray-100;

  code {
    @apply font-mono text-xs;
  }
}

.mock-import__skipped {
  @apply flex flex-col gap-2 text-xs;

  li {
    @apply flex flex-col gap-0.5;
  }

  code {
    @apply font-mono break-all text-gray-800 dark:text-gray-100;
  }

  span {
    @apply text-gray-600 dark:text-gray-300;
  }
}
</style>
