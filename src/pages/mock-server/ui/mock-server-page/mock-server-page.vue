<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import {
  emptyDraft,
  groupHeaderAt,
  MockApiError,
  MockImportForm,
  MockRequestDetail,
  MockRequestRow,
  MockRuleForm,
  MockRuleRow,
  storedGroupSizes,
  toInput,
  useMockRules,
  useMockTraffic,
  validateRule,
  type MockOpenAPIErrors,
  type MockOpenAPIImport,
  type MockOpenAPIResult,
  type MockRequestEvent,
  type MockRule,
  type MockRuleErrors,
  type MockRuleInput
} from '@/entities/mock-server'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { REST_API_URL } from '@/shared/lib/io'
import { useEvents } from '@/shared/lib/use-events'
import { useConnectionStore, useEventsStore } from '@/shared/stores'
import { AppHeader, SkeletonLoader } from '@/shared/ui'

useTitle('Mock server | Buggregator')

const rulesState = useMockRules()
const { rules, configRules, ownRules } = rulesState
const traffic = useMockTraffic()
const { requests, pending, freshIds, paused, noMatchCount, hitsByRule } = traffic
const { events } = useEvents()
const { availableProjects, lockedIds } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())

const baseUrl = `${REST_API_URL}/mock/`
const projects = computed(() => availableProjects.value.map((p) => p.key))

// ---- what the right pane shows -------------------------------------------
type View =
  | { kind: 'traffic' }
  | { kind: 'detail'; uuid: string }
  | { kind: 'edit'; ruleId: string | null; from?: string; back?: View }
  | { kind: 'import' }

const view = ref<View>({ kind: 'traffic' })
const PANE_LABELS: Record<View['kind'], string> = {
  traffic: 'Requests',
  detail: 'Request details',
  edit: 'Rule editor',
  import: 'Import OpenAPI'
}
const filterRuleId = ref<string | null>(null)
const onlyNoMatch = ref(false)
// narrow screens show one pane at a time
const mobilePane = ref<'rules' | 'requests'>('requests')

const ruleNumber = (id: string | null) => rules.value.findIndex((r) => r.id === id) + 1
const ruleLabel = (id: string | null) => {
  const r = rules.value.find((x) => x.id === id)
  return r ? `#${ruleNumber(id)} ${r.name || `${r.method} ${r.path}`}` : undefined
}

const visibleRequests = computed(() =>
  requests.value.filter(
    (e) =>
      (!filterRuleId.value || e.payload.mock.rule_id === filterRuleId.value) &&
      (!onlyNoMatch.value || !e.payload.mock.matched)
  )
)

const current = computed<MockRequestEvent | undefined>(() =>
  view.value.kind === 'detail'
    ? requests.value.find((e) => e.uuid === (view.value as { uuid: string }).uuid)
    : undefined
)
const currentIndex = computed(() =>
  visibleRequests.value.findIndex((e) => e.uuid === current.value?.uuid)
)

const editing = computed(() =>
  view.value.kind === 'edit' && view.value.ruleId
    ? rules.value.find((r) => r.id === (view.value as { ruleId: string }).ruleId)
    : undefined
)
const readOnly = computed(() => !!editing.value?.read_only)

const answeredRuleId = computed(() =>
  current.value?.payload.mock.matched ? current.value.payload.mock.rule_id : null
)
const nearRuleIds = computed(
  () => new Set((current.value?.payload.mock.near || []).map((n) => n.rule_id))
)
const selectedRuleId = computed(() =>
  view.value.kind === 'edit' ? view.value.ruleId : filterRuleId.value
)

const rightPane = ref<HTMLElement | null>(null)
const focusRight = async () => {
  mobilePane.value = 'requests'
  await nextTick()
  rightPane.value?.querySelector<HTMLElement>('h2[tabindex]')?.focus()
}

const showTraffic = () => {
  view.value = { kind: 'traffic' }
}

const openRequest = (e: MockRequestEvent) => {
  view.value = { kind: 'detail', uuid: e.uuid }
  focusRight()
}

const step = (delta: -1 | 1) => {
  const next = visibleRequests.value[currentIndex.value + delta]
  if (next) view.value = { kind: 'detail', uuid: next.uuid }
}

const selectRule = (rule: MockRule) => {
  filterRuleId.value = filterRuleId.value === rule.id ? null : rule.id
  view.value = { kind: 'traffic' }
  mobilePane.value = 'requests'
}

// ---- editor ----------------------------------------------------------------
const draft = ref<MockRuleInput>(emptyDraft())
const formKey = ref(0)
const errors = ref<MockRuleErrors>({})
const formError = ref('')
const saving = ref(false)

const openEditor = (ruleId: string | null, input: MockRuleInput, from?: string) => {
  const back = view.value.kind === 'edit' ? view.value.back : view.value
  draft.value = input
  errors.value = {}
  formError.value = ''
  formKey.value++
  view.value = { kind: 'edit', ruleId, from, back }
  focusRight()
}

const newRule = () => openEditor(null, emptyDraft())
const editRule = (rule: MockRule) => openEditor(rule.id, toInput(rule))
const createFromRequest = (input: MockRuleInput, from: string) => openEditor(null, input, from)
const duplicate = (rule: MockRule) =>
  openEditor(null, { ...toInput(rule), name: rule.name ? `${rule.name} (copy)` : '' })

const closeEditor = () => {
  view.value = (view.value.kind === 'edit' && view.value.back) || { kind: 'traffic' }
}

// re-validate a field once it was shown as wrong, so the message goes away
watch(draft, (value) => {
  if (Object.keys(errors.value).length) errors.value = validateRule(value)
})

const save = async () => {
  if (view.value.kind !== 'edit' || readOnly.value) return
  errors.value = validateRule(draft.value)
  formError.value = ''
  if (Object.keys(errors.value).length) {
    await nextTick()
    rightPane.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }

  saving.value = true
  try {
    const rule = await rulesState.save(view.value.ruleId, draft.value)
    filterRuleId.value = rule.id
    view.value = { kind: 'traffic' }
  } catch (e) {
    if (e instanceof MockApiError && e.status === 422) {
      errors.value = e.fields
      formError.value =
        'The server rejected the rule. Fix the marked fields and save again — your changes are kept.'
    } else {
      formError.value = `${e instanceof Error ? e.message : 'Request failed'}. Your changes are kept; try again.`
    }
  } finally {
    saving.value = false
  }
}

const removeRule = async () => {
  const rule = editing.value
  if (!rule || rule.read_only) return
  if (
    !window.confirm(
      `Delete rule #${ruleNumber(rule.id)} ${rule.method} ${rule.path}? This cannot be undone.`
    )
  )
    return
  try {
    await rulesState.remove(rule.id)
    if (filterRuleId.value === rule.id) filterRuleId.value = null
    view.value = { kind: 'traffic' }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Delete failed'
  }
}

// ---- OpenAPI import ------------------------------------------------------------
const groupSizes = computed(() => storedGroupSizes(rules.value))
const importKey = ref(0)
const importErrors = ref<MockOpenAPIErrors>({})
const importError = ref('')
const importResult = ref<MockOpenAPIResult | null>(null)
const importing = ref(false)

const openImport = () => {
  importErrors.value = {}
  importError.value = ''
  importResult.value = null
  importKey.value++
  view.value = { kind: 'import' }
  focusRight()
}

const runImport = async (input: MockOpenAPIImport) => {
  importing.value = true
  importErrors.value = {}
  importError.value = ''
  try {
    importResult.value = await rulesState.importOpenAPI(input)
    filterRuleId.value = null
    await focusRight()
  } catch (e) {
    if (e instanceof MockApiError && e.status === 422 && Object.keys(e.fields).length) {
      importErrors.value = e.fields
      await nextTick()
      rightPane.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    } else {
      importError.value = e instanceof Error ? e.message : 'Request failed'
    }
  } finally {
    importing.value = false
  }
}

// Deletes the stored rules of a group; yaml rules of it stay.
const removeGroup = async (group: string) => {
  const n = groupSizes.value.get(group) || 0
  if (!n) return
  if (
    !window.confirm(
      `Delete ${n} ${n === 1 ? 'rule' : 'rules'} of group ${group}? This cannot be undone.`
    )
  )
    return
  await runAction(async () => {
    await rulesState.removeGroup(group)
    if (filterRuleId.value && !rules.value.some((r) => r.id === filterRuleId.value)) {
      filterRuleId.value = null
    }
    if (view.value.kind === 'edit' && view.value.ruleId && !editing.value) showTraffic()
  })
}

const actionError = ref('')
const runAction = async (fn: () => Promise<unknown>) => {
  actionError.value = ''
  try {
    await fn()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Request failed'
  }
}

// Like the main Clear: pinned events stay.
const clearRequests = async () => {
  const pinned = new Set(lockedIds.value)
  const uuids = requests.value.map((e) => e.uuid).filter((id) => !pinned.has(id))
  if (!uuids.length) return
  const kept = requests.value.length - uuids.length
  const note = kept ? ` ${kept} pinned ${kept === 1 ? 'request stays' : 'requests stay'}.` : ''
  if (
    !window.confirm(
      `Delete ${uuids.length} captured mock requests? They are HTTP dumps and leave the Events list too.${note}`
    )
  )
    return
  await runAction(async () => {
    // A refused delete keeps the requests: the server still has them.
    if (await events.removeList(uuids)) {
      traffic.forget(uuids)
    }
    showTraffic()
  })
}

// ---- header ------------------------------------------------------------------
const urlCopied = ref(false)
const copyBaseUrl = async () => {
  await copyTextToClipboard(baseUrl)
  urlCopied.value = true
  setTimeout(() => (urlCopied.value = false), 1500)
}

const liveText = computed(() =>
  !isConnectedWS.value ? 'Offline' : paused.value ? 'Paused' : 'Live'
)

// One polite announcement at most every 5 s, never per row.
const announcement = ref('')
let announced = 0
let announceTimer: ReturnType<typeof setTimeout> | null = null
let unannounced = 0
watch(
  () => requests.value.length + pending.value.length,
  (now, before) => {
    if (now <= before) return
    unannounced += now - before
    if (announceTimer) return
    const wait = Math.max(0, announced + 5000 - Date.now())
    announceTimer = setTimeout(() => {
      announcement.value = `${unannounced} new ${unannounced === 1 ? 'request' : 'requests'}`
      unannounced = 0
      announced = Date.now()
      announceTimer = null
    }, wait)
  }
)

const loading = computed(
  () => rulesState.state.value === 'loading' || traffic.state.value === 'loading'
)
const isEmpty = computed(
  () =>
    rulesState.state.value === 'ready' &&
    traffic.state.value === 'ready' &&
    !rules.value.length &&
    !requests.value.length &&
    view.value.kind === 'traffic'
)

const loadAll = () => Promise.all([rulesState.load(), traffic.load()])

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && view.value.kind !== 'traffic') {
    if (view.value.kind === 'edit') closeEditor()
    else if (view.value.kind === 'import' && importing.value) return
    else showTraffic()
  }
}

onMounted(() => {
  loadAll()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (announceTimer) clearTimeout(announceTimer)
})
</script>

<template>
  <LayoutBase>
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader>
        <h1 class="mock-page__title">
          Mock server
        </h1>
        <span
          class="mock-page__url"
          title="Base URL for your client"
        >
          <code>{{ baseUrl }}</code>
          <button
            type="button"
            class="mock-page__icon"
            :aria-label="urlCopied ? 'Copied' : 'Copy base URL'"
            @click="copyBaseUrl"
          >
            {{ urlCopied ? '✓' : '⧉' }}
          </button>
        </span>
        <template #controls>
          <button
            type="button"
            class="mock-page__btn mock-page__btn--head"
            @click="openImport"
          >
            Import <span class="mock-page__hide-xs">OpenAPI</span>
          </button>
          <button
            type="button"
            class="mock-page__btn mock-page__btn--primary mock-page__btn--head"
            @click="newRule"
          >
            + <span class="mock-page__hide-xs">New rule</span>
          </button>
        </template>
      </AppHeader>
    </template>

    <div class="mock-page">
      <p
        class="sr-only"
        aria-live="polite"
      >
        {{ announcement }}
      </p>

      <div
        v-if="rulesState.state.value === 'error' || traffic.state.value === 'error'"
        class="mock-page__callout"
        role="alert"
      >
        <span>Could not load the mock server data. Is the server up to date?</span>
        <button
          type="button"
          class="mock-page__btn"
          @click="loadAll"
        >
          Retry
        </button>
      </div>
      <div
        v-if="actionError"
        class="mock-page__callout"
        role="alert"
      >
        {{ actionError }}
      </div>

      <div
        v-if="isEmpty"
        class="mock-page__empty"
      >
        <h2 class="mock-page__empty-title">
          Fake any API in a minute
        </h2>
        <p>
          1. Point your app's base URL to <b>/mock</b>. 2. Send a request — it shows up here. 3.
          Click it and turn it into a rule.
        </p>
        <code class="mock-page__empty-url">{{ baseUrl }}</code>
        <button
          type="button"
          class="mock-page__btn mock-page__btn--primary"
          @click="newRule"
        >
          + Create first rule
        </button>
        <button
          type="button"
          class="mock-page__btn"
          @click="openImport"
        >
          Import an OpenAPI spec
        </button>
        <p class="mock-page__live">
          <span
            class="mock-page__dot"
            :class="{ 'mock-page__dot--off': !isConnectedWS }"
          />
          Listening for requests to /mock/…
        </p>
      </div>

      <template v-else>
        <div
          class="mock-page__seg"
          role="tablist"
          aria-label="Pane"
        >
          <button
            role="tab"
            type="button"
            :aria-selected="mobilePane === 'rules'"
            @click="mobilePane = 'rules'"
          >
            Rules <span class="mock-page__count">{{ rules.length }}</span>
          </button>
          <button
            role="tab"
            type="button"
            :aria-selected="mobilePane === 'requests'"
            @click="mobilePane = 'requests'"
          >
            Requests <span class="mock-page__count">{{ requests.length }}</span>
          </button>
        </div>

        <div
          class="mock-page__panes"
          :data-show="mobilePane"
        >
          <!-- Rules ------------------------------------------------------- -->
          <section
            class="mock-page__left"
            aria-labelledby="mock-rules-title"
            :aria-busy="loading"
          >
            <div class="mock-page__ph">
              <h2 id="mock-rules-title">
                Rules <span class="mock-page__count">{{ rules.length }}</span>
              </h2>
              <span class="mock-page__muted">first match wins ↓</span>
            </div>
            <div class="mock-page__scroll">
              <SkeletonLoader v-if="rulesState.state.value === 'loading'" />
              <template v-else>
                <template v-if="configRules.length">
                  <div class="mock-page__grp">
                    <span class="mock-page__yaml">yaml</span> buggregator.yaml · read-only
                  </div>
                  <template
                    v-for="(rule, i) in configRules"
                    :key="rule.id"
                  >
                    <div
                      v-if="groupHeaderAt(configRules, i)"
                      class="mock-page__group"
                    >
                      <code :title="rule.group">{{ rule.group }}</code>
                    </div>
                    <MockRuleRow
                      :rule="rule"
                      :order="i + 1"
                      :hits="hitsByRule.get(rule.id)"
                      :selected="selectedRuleId === rule.id"
                      :answered="answeredRuleId === rule.id"
                      :near="nearRuleIds.has(rule.id)"
                      @select="selectRule"
                      @edit="editRule"
                    />
                  </template>
                </template>
                <div
                  v-if="configRules.length"
                  class="mock-page__grp"
                >
                  Your rules
                </div>
                <template
                  v-for="(rule, i) in ownRules"
                  :key="rule.id"
                >
                  <div
                    v-if="groupHeaderAt(ownRules, i)"
                    class="mock-page__group"
                  >
                    <code :title="rule.group">{{ rule.group }}</code>
                    <span class="mock-page__muted">{{ groupSizes.get(rule.group || '') }}</span>
                    <span class="mock-page__spacer" />
                    <button
                      type="button"
                      class="mock-page__icon mock-page__group-del"
                      :aria-label="`Delete group ${rule.group}`"
                      title="Delete group"
                      @click="removeGroup(rule.group || '')"
                    >
                      🗑
                    </button>
                  </div>
                  <MockRuleRow
                    :rule="rule"
                    :order="configRules.length + i + 1"
                    :hits="hitsByRule.get(rule.id)"
                    :selected="selectedRuleId === rule.id"
                    :answered="answeredRuleId === rule.id"
                    :near="nearRuleIds.has(rule.id)"
                    :can-move-up="i > 0"
                    :can-move-down="i < ownRules.length - 1"
                    @select="selectRule"
                    @edit="editRule"
                    @toggle="(r) => runAction(() => rulesState.toggle(r))"
                    @move="(r, d) => runAction(() => rulesState.move(r.id, d))"
                  />
                </template>
                <p
                  v-if="!rules.length"
                  class="mock-page__hint mock-page__pad"
                >
                  No rules yet. Every request gets a 404 until one matches.
                </p>
                <div class="mock-page__pad mock-page__row">
                  <button
                    type="button"
                    class="mock-page__btn"
                    @click="newRule"
                  >
                    + New rule
                  </button>
                  <button
                    type="button"
                    class="mock-page__btn"
                    @click="openImport"
                  >
                    Import OpenAPI
                  </button>
                </div>
              </template>
            </div>
          </section>

          <!-- Right pane ------------------------------------------------ -->
          <section
            ref="rightPane"
            class="mock-page__right"
            :aria-label="PANE_LABELS[view.kind]"
          >
            <!-- live requests -->
            <template v-if="view.kind === 'traffic'">
              <div class="mock-page__ph">
                <h2 tabindex="-1">
                  Requests <span class="mock-page__count">{{ visibleRequests.length }}</span>
                </h2>
                <span
                  class="mock-page__live"
                  :class="{ 'mock-page__live--off': liveText !== 'Live' }"
                ><span class="mock-page__dot" />{{ liveText }}</span>
                <span class="mock-page__spacer" />
                <span
                  v-if="filterRuleId"
                  class="mock-page__filter"
                >
                  Rule {{ ruleLabel(filterRuleId) }}
                  <button
                    type="button"
                    class="mock-page__icon"
                    aria-label="Clear rule filter"
                    @click="filterRuleId = null"
                  >
                    ×
                  </button>
                </span>
                <span
                  v-else
                  class="mock-page__chips"
                  role="group"
                  aria-label="Show"
                >
                  <button
                    type="button"
                    class="mock-page__chip"
                    :aria-pressed="!onlyNoMatch"
                    @click="onlyNoMatch = false"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    class="mock-page__chip"
                    :aria-pressed="onlyNoMatch"
                    @click="onlyNoMatch = true"
                  >
                    No match {{ noMatchCount }}
                  </button>
                </span>
                <button
                  type="button"
                  class="mock-page__icon"
                  :aria-label="paused ? 'Resume live updates' : 'Pause live updates'"
                  :aria-pressed="paused"
                  :title="paused ? 'Resume' : 'Pause'"
                  @click="traffic.setPaused(!paused)"
                >
                  {{ paused ? '▶' : '❚❚' }}
                </button>
                <button
                  type="button"
                  class="mock-page__icon"
                  aria-label="Clear requests"
                  title="Clear"
                  :disabled="!requests.length"
                  @click="clearRequests"
                >
                  🗑
                </button>
              </div>
              <button
                v-if="pending.length"
                type="button"
                class="mock-page__pending"
                @click="traffic.showPending()"
              >
                {{ pending.length }} new — show
              </button>
              <div class="mock-page__scroll">
                <SkeletonLoader v-if="traffic.state.value === 'loading'" />
                <template v-else>
                  <MockRequestRow
                    v-for="e in visibleRequests"
                    :key="e.uuid"
                    :event="e"
                    :rule-label="ruleLabel(e.payload.mock.rule_id)"
                    :fresh="freshIds.has(e.uuid)"
                    @open="openRequest"
                  />
                  <p class="mock-page__hint mock-page__pad mock-page__center">
                    <template v-if="!visibleRequests.length && requests.length">
                      No requests for this filter.
                    </template>
                    <template v-else-if="!requests.length">
                      No requests yet. Send one to <code>{{ baseUrl }}</code>.
                    </template>
                    <template v-else>
                      Click a rule on the left to see only its requests. Every request is also an
                      HTTP dump in Events.
                    </template>
                  </p>
                </template>
              </div>
            </template>

            <!-- request detail -->
            <template v-else-if="view.kind === 'detail'">
              <div class="mock-page__ph">
                <button
                  type="button"
                  class="mock-page__btn mock-page__btn--ghost"
                  @click="showTraffic"
                >
                  ← All requests
                </button>
                <h2
                  class="sr-only"
                  tabindex="-1"
                >
                  Request details
                </h2>
                <span class="mock-page__spacer" />
                <button
                  type="button"
                  class="mock-page__icon"
                  aria-label="Newer request"
                  :disabled="currentIndex <= 0"
                  @click="step(-1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="mock-page__icon"
                  aria-label="Older request"
                  :disabled="currentIndex < 0 || currentIndex >= visibleRequests.length - 1"
                  @click="step(1)"
                >
                  ↓
                </button>
              </div>
              <div class="mock-page__scroll">
                <MockRequestDetail
                  v-if="current"
                  :event="current"
                  :rules="rules"
                  :origin="REST_API_URL"
                  @edit-rule="editRule"
                  @create-rule="createFromRequest"
                />
                <p
                  v-else
                  class="mock-page__hint mock-page__pad"
                >
                  This request was deleted.
                </p>
              </div>
            </template>

            <!-- OpenAPI import -->
            <template v-else-if="view.kind === 'import'">
              <div class="mock-page__ph">
                <button
                  type="button"
                  class="mock-page__btn mock-page__btn--ghost"
                  @click="showTraffic"
                >
                  ← Requests
                </button>
                <span class="mock-page__spacer" />
                <h2
                  class="mock-page__edit-title"
                  tabindex="-1"
                >
                  Import OpenAPI
                </h2>
              </div>
              <div class="mock-page__form">
                <div class="mock-page__scroll mock-page__edit">
                  <div
                    v-if="importError"
                    class="mock-page__callout"
                    role="alert"
                  >
                    <span><b>Couldn't import.</b> {{ importError }}</span>
                  </div>
                  <MockImportForm
                    :key="importKey"
                    :projects="projects"
                    :groups="groupSizes"
                    :errors="importErrors"
                    :busy="importing"
                    :result="importResult"
                    @submit="runImport"
                  />
                </div>
                <div class="mock-page__foot">
                  <span class="mock-page__spacer" />
                  <template v-if="importResult">
                    <button
                      type="button"
                      class="mock-page__btn"
                      @click="openImport"
                    >
                      Import another
                    </button>
                    <button
                      type="button"
                      class="mock-page__btn mock-page__btn--primary"
                      @click="showTraffic"
                    >
                      Done
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      class="mock-page__btn"
                      @click="showTraffic"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="mock-import-form"
                      class="mock-page__btn mock-page__btn--primary"
                      :disabled="importing"
                      :aria-busy="importing"
                    >
                      {{ importing ? 'Importing…' : 'Import' }}
                    </button>
                  </template>
                </div>
              </div>
            </template>

            <!-- rule editor -->
            <template v-else>
              <div class="mock-page__ph">
                <button
                  type="button"
                  class="mock-page__btn mock-page__btn--ghost"
                  @click="closeEditor"
                >
                  ← {{ view.back?.kind === 'detail' ? 'Back to request' : 'Requests' }}
                </button>
                <span class="mock-page__spacer" />
                <h2
                  class="mock-page__edit-title"
                  tabindex="-1"
                >
                  {{
                    view.ruleId
                      ? readOnly
                        ? `Rule #${ruleNumber(view.ruleId)} (yaml)`
                        : `Edit rule #${ruleNumber(view.ruleId)}`
                      : 'New rule'
                  }}
                </h2>
              </div>
              <form
                class="mock-page__form"
                novalidate
                @submit.prevent="save"
              >
                <div class="mock-page__scroll mock-page__edit">
                  <div
                    v-if="readOnly"
                    class="mock-page__callout mock-page__callout--yaml"
                  >
                    <span><b>Defined in buggregator.yaml</b> — read-only here. Change it in the file
                      and restart the server, or duplicate it as an editable rule; it will run after
                      the yaml rules.</span>
                  </div>
                  <div
                    v-if="editing?.group && !readOnly"
                    class="mock-page__callout mock-page__callout--note"
                  >
                    <span>Imported into group <code>{{ editing.group }}</code>. A new import into
                      this group replaces the rule and your changes.</span>
                  </div>
                  <div
                    v-if="formError"
                    class="mock-page__callout"
                    role="alert"
                  >
                    <span><b>Couldn't save.</b> {{ formError }}</span>
                  </div>
                  <MockRuleForm
                    :key="formKey"
                    v-model="draft"
                    :errors="errors"
                    :read-only="readOnly"
                    :projects="projects"
                    :base-url="baseUrl"
                  />
                </div>
                <div class="mock-page__foot">
                  <span
                    v-if="view.from"
                    class="mock-page__muted mock-page__foot-note"
                  >Filled from <code>{{ view.from }}</code> — numbers and UUIDs became
                    <code>{id}</code></span>
                  <button
                    v-if="view.ruleId && !readOnly"
                    type="button"
                    class="mock-page__btn mock-page__btn--danger"
                    @click="removeRule"
                  >
                    Delete
                  </button>
                  <span class="mock-page__spacer" />
                  <template v-if="readOnly && editing">
                    <button
                      type="button"
                      class="mock-page__btn"
                      @click="duplicate(editing)"
                    >
                      Duplicate as editable
                    </button>
                    <button
                      type="button"
                      class="mock-page__btn mock-page__btn--primary"
                      @click="closeEditor"
                    >
                      Close
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      class="mock-page__btn"
                      @click="closeEditor"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="mock-page__btn mock-page__btn--primary"
                      :disabled="saving"
                      :aria-busy="saving"
                    >
                      {{ saving ? 'Saving…' : view.ruleId ? 'Save rule' : 'Create rule' }}
                    </button>
                  </template>
                </div>
              </form>
            </template>
          </section>
        </div>
      </template>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.mock-page {
  @apply flex flex-col h-full min-h-0 bg-gray-50 dark:bg-gray-900;
}

.mock-page__title {
  @apply text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap;
}

.mock-page__url {
  @apply hidden md:inline-flex items-center gap-1 ml-3 pl-2 rounded border border-gray-200 dark:border-gray-700 min-w-0;
  @apply bg-white dark:bg-gray-800;

  code {
    @apply font-mono text-xs text-gray-700 dark:text-gray-200 truncate;
  }
}

// Hidden on phones but still read out: «+ New rule», «Import OpenAPI».
.mock-page__hide-xs {
  @apply sr-only sm:not-sr-only;
}

.mock-page__panes {
  @apply flex flex-1 min-h-0;
}

.mock-page__left {
  @apply flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
  @apply w-full lg:w-[340px] xl:w-[380px] lg:shrink-0;
}

.mock-page__right {
  @apply flex flex-col flex-1 min-h-0 min-w-0 bg-white dark:bg-gray-800;
}

// < 1024 px: one pane at a time, switched by the segmented control
@media (max-width: 1023px) {
  .mock-page__panes[data-show='rules'] .mock-page__right,
  .mock-page__panes[data-show='requests'] .mock-page__left {
    @apply hidden;
  }
}

.mock-page__seg {
  @apply flex lg:hidden m-3 p-0.5 rounded bg-gray-100 dark:bg-gray-900;

  button {
    @apply flex-1 h-10 sm:h-8 rounded text-xs font-medium text-gray-600 dark:text-gray-300;

    &[aria-selected='true'] {
      @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow;
    }
  }
}

.mock-page__ph {
  @apply flex flex-wrap items-center gap-2 px-3 md:px-4 min-h-[44px] py-1.5 border-b border-gray-200 dark:border-gray-700;

  h2 {
    @apply text-sm font-semibold text-gray-900 dark:text-white;
  }
}

.mock-page__scroll {
  @apply flex-1 min-h-0 overflow-auto;
}

.mock-page__count {
  @apply ml-1 px-1.5 rounded-full text-2xs font-mono bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
}

.mock-page__muted,
.mock-page__hint {
  @apply text-xs text-gray-500 dark:text-gray-400;

  code {
    @apply font-mono;
  }
}

.mock-page__pad {
  @apply px-4 py-3;
}

.mock-page__center {
  @apply text-center;
}

.mock-page__spacer {
  @apply flex-1;
}

.mock-page__grp {
  @apply flex items-center gap-2 px-3 py-1.5 text-2xs font-medium uppercase tracking-wide;
  @apply bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
}

.mock-page__group {
  @apply flex items-center gap-2 px-3 py-1 min-w-0 text-2xs;
  @apply bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300;
  @apply border-t border-gray-200 dark:border-gray-700;

  code {
    @apply font-mono truncate;
  }
}

.mock-page__icon.mock-page__group-del {
  @apply shrink-0;

  @media (max-width: 639px) {
    @apply w-11 h-11;
  }
}

.mock-page__row {
  @apply flex flex-wrap gap-2;
}

.mock-page__yaml {
  @apply px-1 rounded normal-case bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400;
}

.mock-page__live {
  @apply inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400;
}

.mock-page__live--off {
  @apply text-gray-500 dark:text-gray-400;

  .mock-page__dot {
    @apply bg-gray-400 animate-none;
  }
}

.mock-page__dot {
  @apply inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse;

  @media (prefers-reduced-motion: reduce) {
    @apply animate-none;
  }
}

.mock-page__dot--off {
  @apply bg-gray-400 animate-none;
}

.mock-page__filter {
  @apply inline-flex items-center gap-1 pl-2 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400;
}

.mock-page__chips {
  @apply hidden sm:inline-flex gap-1;
}

.mock-page__chip {
  @apply h-7 px-2 rounded text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200;

  &[aria-pressed='true'] {
    @apply border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400;
  }
}

.mock-page__pending {
  @apply w-full py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10;
}

.mock-page__icon {
  @apply inline-flex items-center justify-center w-7 h-7 rounded text-xs text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed;

  @media (max-width: 639px) {
    @apply w-10 h-10;
  }
}

.mock-page__btn {
  @apply inline-flex items-center justify-center gap-1 h-7 px-3 rounded text-xs font-medium whitespace-nowrap;
  @apply border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400;

  @media (max-width: 639px) {
    @apply h-11 min-w-11;
  }
}

.mock-page__btn--head {
  // the header bar is 36 px: the button stays inside, the hit area reaches 44
  @media (max-width: 639px) {
    @apply relative h-9;

    // The bar sits at the top edge, so the extra room goes down: placed from
    // the padding box, -12px makes the tap area about 45 px tall.
    &::after {
      content: '';
      @apply absolute inset-x-0 top-0 -bottom-3;
    }
  }
}

.mock-page__btn--primary {
  @apply bg-blue-600 border-blue-600 text-white dark:text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500;

  &[aria-busy='true'] {
    cursor: progress;
  }
}

.mock-page__btn--ghost {
  @apply bg-transparent border-transparent dark:bg-transparent;
}

.mock-page__btn--danger {
  @apply bg-transparent dark:bg-transparent border-red-700 text-red-700 dark:border-red-400 dark:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
}

.mock-page__callout {
  @apply flex flex-wrap items-center gap-3 m-3 p-3 rounded text-xs;
  @apply border border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200;
}

.mock-page__callout--yaml {
  @apply border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200;
}

.mock-page__callout--note {
  @apply border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200;

  code {
    @apply font-mono;
  }
}

.mock-page__form {
  @apply flex flex-col flex-1 min-h-0;
}

.mock-page__edit {
  @apply p-4 md:p-5;

  .mock-page__callout {
    @apply mx-0 mt-0 mb-4;
  }
}

.mock-page__edit-title {
  @apply text-xs;
}

.mock-page__foot {
  @apply flex flex-wrap items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;

  @media (max-width: 639px) {
    .mock-page__btn {
      @apply flex-1;
    }

    .mock-page__spacer {
      @apply hidden;
    }
  }
}

.mock-page__foot-note {
  @apply w-full;
}

.mock-page__empty {
  @apply flex flex-col items-center gap-4 max-w-xl mx-auto my-12 px-4 text-center text-sm text-gray-700 dark:text-gray-200;
}

.mock-page__empty-title {
  @apply text-base font-semibold text-gray-900 dark:text-white;
}

.mock-page__empty-url {
  @apply px-3 py-1.5 rounded font-mono text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
}
</style>
