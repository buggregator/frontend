<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import {
  CONDITION_OPS,
  CONDITION_PLACES,
  MAX_CONDITIONS,
  emptyCondition,
  needsValue
} from '../../lib/mock-conditions'
import type { MockCondition, MockRuleErrors } from '../../types'

type Props = {
  modelValue: MockCondition[]
  errors?: MockRuleErrors
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  readOnly: false
})

const emit = defineEmits<{ 'update:modelValue': [value: MockCondition[]] }>()

const root = ref<HTMLElement | null>(null)

const update = (i: number, part: Partial<MockCondition>) =>
  emit(
    'update:modelValue',
    props.modelValue.map((c, j) => (j === i ? { ...c, ...part } : c))
  )

const focusName = async (i: number) => {
  await nextTick()
  const names = root.value?.querySelectorAll<HTMLInputElement>('.mock-conditions__name')
  const target = names?.[Math.min(i, names.length - 1)]
  if (target) target.focus()
  else root.value?.querySelector<HTMLButtonElement>('.mock-conditions__add')?.focus()
}

const add = () => {
  emit('update:modelValue', [...props.modelValue, emptyCondition()])
  focusName(props.modelValue.length)
}

// Focus stays in the list: on the row that took the removed one's place.
const remove = (i: number) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, j) => j !== i)
  )
  focusName(i)
}

const errorOf = (i: number) => props.errors[`conditions.${i}`]
// The server words a value error "value must be …"; everything else is the name's.
const valueError = (i: number) => /^value/i.test(errorOf(i) ?? '')
const errorId = (i: number) => `mock-err-conditions-${i}`

const namePlaceholder = (c: MockCondition) => (c.in === 'header' ? 'Authorization' : 'card.token')
const nameLabel = (c: MockCondition, i: number) =>
  `Condition ${i + 1} ${c.in === 'header' ? 'header name' : 'body field path'}`
</script>

<template>
  <div
    v-if="!readOnly || modelValue.length"
    ref="root"
    class="mock-conditions"
    role="group"
    aria-labelledby="mock-conditions-label"
    aria-describedby="mock-conditions-hint"
  >
    <span
      id="mock-conditions-label"
      class="mock-conditions__label"
    >
      Conditions
      <span class="mock-conditions__hint">{{
        modelValue.length ? `${modelValue.length} · all must hold` : 'optional'
      }}</span>
    </span>

    <div
      v-for="(c, i) in modelValue"
      :key="i"
      class="mock-conditions__row"
    >
      <div class="mock-conditions__fields">
        <select
          class="mock-conditions__input mock-conditions__in"
          :value="c.in"
          :disabled="readOnly"
          :aria-label="`Condition ${i + 1} looks at`"
          @change="
            update(i, { in: ($event.target as HTMLSelectElement).value as MockCondition['in'] })
          "
        >
          <option
            v-for="p in CONDITION_PLACES"
            :key="p.value"
            :value="p.value"
          >
            {{ p.label }}
          </option>
        </select>
        <input
          class="mock-conditions__input mock-conditions__mono mock-conditions__name"
          :class="{ 'mock-conditions__input--error': errorOf(i) && !valueError(i) }"
          :value="c.name"
          :placeholder="namePlaceholder(c)"
          :readonly="readOnly"
          :aria-label="nameLabel(c, i)"
          :aria-invalid="errorOf(i) && !valueError(i) ? 'true' : undefined"
          :aria-describedby="errorOf(i) ? errorId(i) : undefined"
          spellcheck="false"
          autocomplete="off"
          @input="update(i, { name: ($event.target as HTMLInputElement).value })"
        >
        <select
          class="mock-conditions__input mock-conditions__op"
          :value="c.op"
          :disabled="readOnly"
          :aria-label="`Condition ${i + 1} comparison`"
          @change="
            update(i, { op: ($event.target as HTMLSelectElement).value as MockCondition['op'] })
          "
        >
          <option
            v-for="o in CONDITION_OPS"
            :key="o.value"
            :value="o.value"
          >
            {{ o.label }}
          </option>
        </select>
        <input
          v-if="needsValue(c.op)"
          class="mock-conditions__input mock-conditions__mono mock-conditions__value"
          :class="{ 'mock-conditions__input--error': valueError(i) }"
          :value="c.value ?? ''"
          placeholder="Value"
          :readonly="readOnly"
          :aria-label="`Condition ${i + 1} value`"
          :aria-invalid="valueError(i) ? 'true' : undefined"
          :aria-describedby="valueError(i) ? errorId(i) : undefined"
          spellcheck="false"
          autocomplete="off"
          @input="update(i, { value: ($event.target as HTMLInputElement).value })"
        >
        <span
          v-else
          class="mock-conditions__value mock-conditions__novalue"
        >no value needed</span>
      </div>
      <button
        v-if="!readOnly"
        type="button"
        class="mock-conditions__icon"
        :aria-label="`Remove condition ${i + 1}${c.name ? ` (${c.name})` : ''}`"
        @click="remove(i)"
      >
        ×
      </button>
      <p
        v-if="errorOf(i)"
        :id="errorId(i)"
        class="mock-conditions__error"
      >
        ⚠ {{ errorOf(i) }}
      </p>
    </div>

    <p
      v-if="errors.conditions"
      id="mock-err-conditions"
      class="mock-conditions__error"
      role="alert"
    >
      ⚠ {{ errors.conditions }}
    </p>

    <button
      v-if="!readOnly"
      type="button"
      class="mock-conditions__add"
      :disabled="modelValue.length >= MAX_CONDITIONS"
      @click="add"
    >
      + Add condition
      <span
        v-if="modelValue.length >= MAX_CONDITIONS"
        class="mock-conditions__hint"
      >(at most {{ MAX_CONDITIONS }})</span>
    </button>

    <p
      id="mock-conditions-hint"
      class="mock-conditions__hint"
    >
      <template v-if="modelValue.length">
        Rules are tried top to bottom: keep this rule <b>above</b> a general rule for the same
        path. Header names ignore case. Body field: <code>card.token</code>,
        <code>items.0.id</code>, <code>items.*.id</code> (any item). A missing field never
        equals.
      </template>
      <template v-else>
        Match a request header or a JSON body field too, e.g. <code>Authorization</code> equals
        <code>Bearer good</code>.
      </template>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.mock-conditions {
  @apply flex flex-col gap-2 min-w-0;
  container-type: inline-size;
}

.mock-conditions__label {
  @apply flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300;
}

.mock-conditions__hint {
  @apply text-2xs font-normal text-gray-500 dark:text-gray-400;

  code {
    @apply font-mono;
  }

  b {
    @apply font-semibold text-gray-700 dark:text-gray-200;
  }
}

.mock-conditions__row {
  @apply grid gap-x-2 gap-y-1 items-start;
  grid-template-columns: minmax(0, 1fr) auto;
}

// Where / name / comparison / value: one line when the pane has room, two on
// a narrower one (where + comparison beside name + value), stacked when narrow.
.mock-conditions__fields {
  @apply grid gap-2 min-w-0;
  grid-template-columns: 7.5rem minmax(0, 2fr) 8.5rem minmax(0, 3fr);

  @container (max-width: 47.99rem) {
    grid-template-columns: 7.5rem minmax(0, 1fr);

    .mock-conditions__in {
      grid-column: 1;
      grid-row: 1;
    }

    .mock-conditions__op {
      grid-column: 1;
      grid-row: 2;
    }

    .mock-conditions__name {
      grid-column: 2;
      grid-row: 1;
    }

    .mock-conditions__value {
      grid-column: 2;
      grid-row: 2;
    }
  }

  @container (max-width: 25.99rem) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

    .mock-conditions__in {
      grid-column: 1;
      grid-row: 1;
    }

    .mock-conditions__op {
      grid-column: 2;
      grid-row: 1;
    }

    .mock-conditions__name {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .mock-conditions__value {
      grid-column: 1 / -1;
      grid-row: 3;
    }
  }
}

.mock-conditions__input {
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

.mock-conditions__input--error {
  @apply border-red-700 dark:border-red-400 ring-1 ring-red-700 dark:ring-red-400;
}

.mock-conditions__mono {
  @apply font-mono text-xs;

  @media (max-width: 639px) {
    @apply text-base;
  }
}

.mock-conditions__novalue {
  @apply flex items-center h-8 px-2 text-2xs italic text-gray-500 dark:text-gray-400;

  @container (max-width: 25.99rem) {
    @apply hidden;
  }
}

.mock-conditions__icon {
  @apply w-8 h-8 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  @media (max-width: 639px) {
    @apply w-10 h-10;
  }
}

.mock-conditions__error {
  @apply col-span-full text-xs text-red-700 dark:text-red-400;
}

.mock-conditions__add {
  @apply self-start text-xs text-blue-700 dark:text-blue-400 hover:underline;
  @apply disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed;
}
</style>
