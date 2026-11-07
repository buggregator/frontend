<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fakeCategories, fakeSnippet, filterFakes } from '../../lib/mock-template'
import { useMockHelpers } from '../../lib/use-mock-template'
import type { MockHelperGroup } from '../../types'

const emit = defineEmits<{ insert: [snippet: string] }>()

// How many fake generators one page of the list shows (there are ~250).
const FAKES_PAGE = 30

const GROUPS: { key: MockHelperGroup; title: string }[] = [
  { key: 'request', title: 'From the request' },
  { key: 'fake', title: 'Fake data' },
  { key: 'data', title: 'Data' },
  { key: 'output', title: 'Output' },
]

const { helpers, fakes, state, load } = useMockHelpers()
onMounted(load)

const tab = ref<'functions' | 'fake'>('functions')
const query = ref('')
const category = ref('')
const shown = ref(FAKES_PAGE)

const groups = computed(() =>
  GROUPS.map((g) => ({ ...g, items: helpers.value.filter((h) => h.group === g.key) })).filter((g) => g.items.length)
)
const categories = computed(() => fakeCategories(fakes.value))
const found = computed(() => filterFakes(fakes.value, query.value, category.value))
const visible = computed(() => found.value.slice(0, shown.value))

const resetPage = () => (shown.value = FAKES_PAGE)
</script>

<template>
  <section
    class="mock-helpers"
    aria-label="Template helpers"
  >
    <div
      class="mock-helpers__tabs"
      role="tablist"
    >
      <button
        id="mock-helpers-tab-functions"
        type="button"
        role="tab"
        class="mock-helpers__tab"
        :aria-selected="tab === 'functions'"
        aria-controls="mock-helpers-panel"
        @click="tab = 'functions'"
      >
        Functions
      </button>
      <button
        id="mock-helpers-tab-fake"
        type="button"
        role="tab"
        class="mock-helpers__tab"
        :aria-selected="tab === 'fake'"
        aria-controls="mock-helpers-panel"
        @click="tab = 'fake'"
      >
        Fake data <span class="mock-helpers__count">{{ fakes.length }}</span>
      </button>
    </div>

    <div
      id="mock-helpers-panel"
      role="tabpanel"
      :aria-labelledby="`mock-helpers-tab-${tab}`"
      class="mock-helpers__panel"
    >
      <p
        v-if="state === 'loading'"
        class="mock-helpers__note"
      >
        Loading helpers…
      </p>
      <p
        v-else-if="state === 'error'"
        class="mock-helpers__note"
      >
        Couldn't load the helper list.
        <button
          type="button"
          class="mock-helpers__link"
          @click="load"
        >
          Try again
        </button>
      </p>

      <template v-else-if="tab === 'functions'">
        <div
          v-for="g in groups"
          :key="g.key"
          class="mock-helpers__group"
        >
          <h4 class="mock-helpers__group-title">
            {{ g.title }}
          </h4>
          <ul class="mock-helpers__list">
            <li
              v-for="h in g.items"
              :key="h.name"
              class="mock-helpers__item"
            >
              <div class="mock-helpers__head">
                <code class="mock-helpers__usage">{{ h.usage }}</code>
                <span class="mock-helpers__actions">
                  <button
                    type="button"
                    class="mock-helpers__insert"
                    :aria-label="`Insert ${h.name}`"
                    @click="emit('insert', `{{ ${h.usage} }}`)"
                  >Insert</button>
                  <button
                    type="button"
                    class="mock-helpers__insert"
                    :aria-label="`Insert the ${h.name} example`"
                    @click="emit('insert', h.example)"
                  >Example</button>
                </span>
              </div>
              <p class="mock-helpers__desc">
                {{ h.description }}
              </p>
              <p class="mock-helpers__example">
                <code>{{ h.example }}</code> <span aria-hidden="true">→</span><span class="sr-only">gives</span>
                <code>{{ h.result }}</code>
              </p>
            </li>
          </ul>
        </div>
      </template>

      <template v-else>
        <div class="mock-helpers__filters">
          <input
            v-model="query"
            type="search"
            class="mock-helpers__input"
            placeholder="Search: email, uuid, price…"
            aria-label="Search fake data generators"
            @input="resetPage"
          >
          <select
            v-model="category"
            class="mock-helpers__input mock-helpers__select"
            aria-label="Category"
            @change="resetPage"
          >
            <option value="">
              All categories
            </option>
            <option
              v-for="c in categories"
              :key="c"
              :value="c"
            >
              {{ c }}
            </option>
          </select>
        </div>
        <p
          class="mock-helpers__note"
          aria-live="polite"
        >
          {{ found.length }} of {{ fakes.length }} generators
        </p>
        <ul class="mock-helpers__list">
          <li
            v-for="f in visible"
            :key="f.name"
            class="mock-helpers__item"
          >
            <div class="mock-helpers__head">
              <code class="mock-helpers__usage">{{ f.name }}</code>
              <span class="mock-helpers__category">{{ f.category }}</span>
              <span class="mock-helpers__actions">
                <button
                  type="button"
                  class="mock-helpers__insert"
                  :aria-label="`Insert fake ${f.name}`"
                  @click="emit('insert', fakeSnippet(f))"
                >Insert</button>
              </span>
            </div>
            <p class="mock-helpers__desc">
              {{ f.description }}
            </p>
            <p
              v-if="f.params.length"
              class="mock-helpers__params"
            >
              <span
                v-for="p in f.params"
                :key="p.name"
              ><code>{{ p.name }}</code> {{ p.type }}<template v-if="p.optional">, optional</template><template v-if="p.default">, default {{ p.default }}</template><template v-if="p.options?.length">: {{ p.options.join(' | ') }}</template></span>
            </p>
            <p class="mock-helpers__example">
              <code>{{ fakeSnippet(f) }}</code> <span aria-hidden="true">→</span><span class="sr-only">gives, for example,</span>
              <code class="mock-helpers__sample">{{ f.example }}</code>
            </p>
          </li>
        </ul>
        <button
          v-if="found.length > visible.length"
          type="button"
          class="mock-helpers__link"
          @click="shown += FAKES_PAGE"
        >
          Show {{ Math.min(FAKES_PAGE, found.length - visible.length) }} more
        </button>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.mock-helpers {
  @apply flex flex-col rounded border border-gray-300 dark:border-gray-600 min-w-0;
}

.mock-helpers__tabs {
  @apply flex gap-1 px-2 pt-2 border-b border-gray-300 dark:border-gray-600;
}

.mock-helpers__tab {
  @apply h-8 px-3 text-xs font-medium rounded-t border-b-2 border-transparent;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;

  &[aria-selected='true'] {
    @apply border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400;
  }
}

.mock-helpers__count {
  @apply ml-1 text-2xs text-gray-500 dark:text-gray-400;
}

.mock-helpers__panel {
  @apply flex flex-col gap-3 p-3 max-h-[28rem] overflow-y-auto;
}

.mock-helpers__group-title {
  @apply mb-1 text-2xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300;
}

.mock-helpers__list {
  @apply flex flex-col gap-2;
}

.mock-helpers__item {
  @apply flex flex-col gap-1 p-2 rounded bg-gray-50 dark:bg-gray-900 min-w-0;
}

.mock-helpers__head {
  @apply flex items-center gap-2 min-w-0;
}

.mock-helpers__usage {
  @apply font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 [overflow-wrap:anywhere];
}

.mock-helpers__category {
  @apply text-2xs text-gray-500 dark:text-gray-400;
}

.mock-helpers__actions {
  @apply ml-auto flex shrink-0 gap-1;
}

.mock-helpers__insert {
  @apply h-7 px-2 rounded text-xs border border-gray-400 dark:border-gray-500;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;
}

.mock-helpers__desc,
.mock-helpers__params,
.mock-helpers__note {
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.mock-helpers__params {
  @apply flex flex-wrap gap-x-3;

  code {
    @apply font-mono;
  }
}

.mock-helpers__example {
  @apply font-mono text-2xs text-gray-700 dark:text-gray-300 [overflow-wrap:anywhere];
}

.mock-helpers__sample {
  @apply inline-block max-h-16 overflow-hidden align-top whitespace-pre-wrap;
}

.mock-helpers__filters {
  @apply flex flex-wrap gap-2;
}

.mock-helpers__input {
  @apply flex-1 min-w-[10rem] h-8 px-2 rounded text-sm;
  @apply bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-500;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500;

  @media (max-width: 639px) {
    @apply h-10 text-base;
  }
}

.mock-helpers__select {
  @apply flex-none w-auto;
}

.mock-helpers__link {
  @apply self-start text-xs text-blue-700 dark:text-blue-400 hover:underline;
}
</style>
