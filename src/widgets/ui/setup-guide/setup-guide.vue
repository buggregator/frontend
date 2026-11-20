<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, useId } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { fillSegments, fillText, usedPorts } from './fill'
import SetupCodeBlock from './setup-code-block.vue'
import SetupExternalIcon from './setup-external-icon.vue'
import content from './setup-help.json'
import SetupStackTabs from './setup-stack-tabs.vue'
import type { SetupContent } from './types'
import { pageHost, useSetupHost, useSetupStack } from './use-setup-prefs'
import { useSetupValues } from './use-setup-values'

// How to send the first event of a section, with this server's values filled
// in (#5941, design #5938). `page` on an empty section, `panel` in the drawer
// (no hero there: the drawer has its own heading).
type Props = {
  sectionId: string
  sectionTitle: string
  variant?: 'page' | 'panel'
  // «Sentry · Exceptions» where the section has sub-pages.
  kicker?: string
}

const props = withDefaults(defineProps<Props>(), { variant: 'page', kicker: '' })

const { sections } = content as SetupContent
const section = computed(() => sections.find((s) => s.id === props.sectionId))

const { activeProject } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())

// Host
const { setHost, resetHost } = useSetupHost()
const { host, pageHttp, resolved, values } = useSetupValues()
const isEditingHost = ref(false)
const hostDraft = ref('')
const hostInput = ref<HTMLInputElement | null>(null)
const changeBtn = ref<HTMLButtonElement | null>(null)
const uid = useId()

const editHost = async () => {
  hostDraft.value = host.value
  isEditingHost.value = true
  await nextTick()
  hostInput.value?.select()
}
const closeEditor = async () => {
  isEditingHost.value = false
  await nextTick()
  changeBtn.value?.focus()
}
const useHost = () => {
  if (hostDraft.value.trim()) setHost(hostDraft.value)
  closeEditor()
}
const resetToPage = () => {
  resetHost()
  closeEditor()
}


// Stack: one choice for every section; a section without it shows its first.
const { stack, setStack } = useSetupStack()
const current = computed(
  () => section.value?.stacks.find((s) => s.id === stack.value) ?? section.value?.stacks[0]
)

// A stack may bring its own steps (OpenTelemetry has no DSN to set).
const steps = computed(() => current.value?.steps ?? section.value?.steps ?? [])

const portsUsed = computed(() => {
  if (!current.value || !section.value) return []
  return usedPorts([current.value.code, ...steps.value].join('\n'))
})
// No ports from the server at all (an old server): every one is a guess.
const portsUnknown = computed(() =>
  portsUsed.value.filter((p) => resolved.value.defaulted.has(p) && !resolved.value.off.has(p))
)
// The server sent its ports, this listener is not among them: it is off.
const LISTENERS: Record<string, string> = {
  smtp_port: 'The SMTP server',
  monolog_port: 'The Monolog listener',
  vardumper_port: 'The VarDumper listener',
  proxy_port: 'The HTTP proxy',
  xdebug_port: 'The Xdebug proxy'
}
const portsOff = computed(() =>
  portsUsed.value
    .filter((p) => resolved.value.off.has(p))
    .map(
      (p) =>
        `${LISTENERS[p] ?? 'This listener'} is off on this server; ${values.value[p]} is its default port.`
    )
)
// The page is on https: the samples say http://, the app should not.
const httpsNote = computed(() => !!pageHttp.value?.https && portsUsed.value.includes('http_port'))

const projectName = computed(() => activeProject.value?.name ?? 'Default')
const projectKey = computed(() => activeProject.value?.key ?? 'default')

const what = computed(() => {
  if (props.sectionId === 'sentry') return 'exception'
  if (props.sectionId === 'smtp') return 'message'
  return 'event'
})

const tabs = ref<InstanceType<typeof SetupStackTabs> | null>(null)
defineExpose({ focusTabs: () => tabs.value?.focusSelected() })
</script>

<template>
  <div
    v-if="section"
    class="setup-guide"
    :class="`setup-guide--${variant}`"
    data-test="setup-guide"
  >
    <header
      v-if="variant === 'page'"
      class="setup-guide__hero"
    >
      <div class="setup-guide__hero-text">
        <p
          v-if="kicker"
          class="setup-guide__kicker"
        >
          {{ kicker }}
        </p>
        <h2 class="setup-guide__title">
          {{ section.title }}
        </h2>
        <p class="setup-guide__lead">
          {{ section.lead }}
        </p>
      </div>
      <a
        class="setup-guide__docs"
        :href="section.docs"
        target="_blank"
        rel="noopener noreferrer"
      >{{ sectionTitle }} docs<SetupExternalIcon /><span class="sr-only">
        (opens in a new tab)</span></a>
    </header>

    <p
      v-if="variant === 'page'"
      class="setup-guide__status"
      :class="isConnectedWS ? 'setup-guide__status--on' : 'setup-guide__status--off'"
      role="status"
    >
      <span
        class="setup-guide__dot"
        aria-hidden="true"
      />
      <template v-if="isConnectedWS">
        Connected. Waiting for the first {{ what }} in {{ projectName }}.
      </template>
      <template v-else>
        Not connected to Buggregator. New events will show once the page reconnects.
      </template>
    </p>

    <dl class="setup-guide__target">
      <div class="setup-guide__target-row">
        <dt>App reaches this server at</dt>
        <dd>
          <template v-if="!isEditingHost">
            <span class="setup-guide__mono setup-guide__strong">{{ host }}</span>
            <button
              ref="changeBtn"
              type="button"
              class="setup-guide__link-btn"
              :aria-label="`Change the host, now ${host}`"
              @click="editHost"
            >
              Change
            </button>
            <p class="setup-guide__hint">
              Ports are the ones this server listens on: with Docker port mapping, use the published
              ones.
            </p>
          </template>
          <form
            v-else
            class="setup-guide__host-form"
            @submit.prevent="useHost"
            @keydown.esc.stop.prevent="closeEditor"
          >
            <input
              :id="`${uid}-host`"
              ref="hostInput"
              v-model="hostDraft"
              class="setup-guide__host-input"
              type="text"
              spellcheck="false"
              autocomplete="off"
              aria-label="Host"
              :aria-describedby="`${uid}-host-hint`"
            >
            <button
              type="submit"
              class="setup-guide__use"
            >
              Use
            </button>
            <button
              type="button"
              class="setup-guide__link-btn"
              @click="resetToPage"
            >
              Reset to {{ pageHost() }}
            </button>
            <p
              :id="`${uid}-host-hint`"
              class="setup-guide__hint"
            >
              The host as your app sees it. Saved in this browser.
            </p>
          </form>
        </dd>
      </div>
      <div class="setup-guide__target-row">
        <dt>Project</dt>
        <dd>
          <span class="setup-guide__strong">{{ projectName }}</span>
          <span class="setup-guide__mono setup-guide__muted"> ({{ projectKey }})</span>
          <p class="setup-guide__hint">
            Switch the project in the menu and the settings below follow.
          </p>
        </dd>
      </div>
    </dl>

    <p
      v-if="portsUnknown.length"
      class="setup-guide__warn"
      data-test="setup-ports-unknown"
    >
      Could not read this server’s ports, showing the defaults ({{
        portsUnknown.map((p) => values[p]).join(', ')
      }}).
    </p>
    <p
      v-for="text in portsOff"
      :key="text"
      class="setup-guide__warn"
      data-test="setup-port-off"
    >
      {{ text }}
    </p>
    <p
      v-if="httpsNote"
      class="setup-guide__warn"
      data-test="setup-https-note"
    >
      This page is on https: in the samples use https:// instead of http:// with port
      {{ values.http_port }}.
    </p>

    <ol class="setup-guide__steps">
      <li
        v-for="(step, i) in steps"
        :key="i"
      >
        <template
          v-for="(seg, j) in fillSegments(step, values)"
          :key="j"
        >
          <span :class="{ 'setup-guide__mono setup-guide__strong': seg.fill }">{{ seg.text }}</span>
        </template>
      </li>
    </ol>

    <SetupStackTabs
      v-if="current"
      ref="tabs"
      :stacks="section.stacks"
      :selected="current.id"
      :id-prefix="uid"
      @select="setStack"
    />

    <div
      v-if="current"
      :id="`${uid}-panel`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-${current.id}`"
      class="setup-guide__panel"
    >
      <SetupCodeBlock
        :code="current.code"
        :file="current.file"
        :values="values"
      />
      <p
        v-if="current.hint"
        class="setup-guide__hint setup-guide__stack-hint"
      >
        {{ fillText(current.hint, values) }}
      </p>
      <p class="setup-guide__legend">
        Underlined values come from this server and project. Copy takes the text as shown.
      </p>
    </div>

    <footer class="setup-guide__footer">
      Other stacks, Docker and troubleshooting:
      <a
        :href="section.docs"
        target="_blank"
        rel="noopener noreferrer"
      >{{ sectionTitle }} setup in the docs<SetupExternalIcon /><span class="sr-only">
        (opens in a new tab)</span></a>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.setup-guide {
  --setup-surface: theme('colors.gray.50');
  @apply w-full text-sm text-gray-800 dark:text-gray-200;

  // `.dark .setup-guide[data-v]`: outranks --panel; page and panel are
  // gray-800 in dark. (`:global(.dark) .x` compiles to a bare `.dark`.)
  .dark & {
    --setup-surface: theme('colors.gray.800');
  }
}

.setup-guide--page {
  @apply mx-auto max-w-[720px] px-6 pt-10 pb-14;

  @media (max-width: 639px) {
    @apply px-4 pt-6 pb-10;
  }
}

.setup-guide--panel {
  --setup-surface: theme('colors.white');
  @apply px-6 pt-4 pb-10;

  @media (max-width: 639px) {
    @apply px-4 pt-3 pb-8;
  }
}

.setup-guide__hero {
  @apply flex items-start justify-between gap-6;

  @media (max-width: 639px) {
    @apply flex-col gap-1;
  }
}

.setup-guide__kicker {
  @apply m-0 mb-1 text-xs font-medium text-gray-600 dark:text-gray-400;
}

.setup-guide__title {
  @apply m-0 text-[22px] leading-tight font-semibold text-gray-900 dark:text-gray-100;

  @media (max-width: 639px) {
    @apply text-xl;
  }
}

.setup-guide__lead {
  @apply m-0 mt-1.5 text-gray-600 dark:text-gray-400;
  max-width: 60ch;
}

.setup-guide__docs,
.setup-guide__footer a {
  @apply text-[13px] font-medium whitespace-nowrap;
  @apply text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200;
}

.setup-guide__docs {
  @apply mt-1;

  @media (max-width: 639px) {
    @apply inline-flex items-center min-h-[44px] mt-0;
  }
}

.setup-guide__status {
  @apply flex items-center gap-2 m-0 mt-4 text-[13px];
}

.setup-guide__dot {
  @apply w-2 h-2 rounded-full bg-current flex-shrink-0;
}

.setup-guide__status--on {
  @apply text-green-700 dark:text-green-400;
}

.setup-guide__status--off {
  @apply text-amber-700 dark:text-amber-400;
}

.setup-guide__target {
  @apply m-0 mt-5 text-[13px] border-y border-gray-200 dark:border-gray-700;

  .setup-guide--panel & {
    @apply mt-0;
  }
}

.setup-guide__target-row {
  @apply grid gap-x-4 py-2.5;
  grid-template-columns: 12rem minmax(0, 1fr);

  & + & {
    @apply border-t border-gray-200 dark:border-gray-700;
  }

  dt {
    @apply text-gray-600 dark:text-gray-400;
  }

  dd {
    @apply m-0 min-w-0 break-words;
  }

  @media (max-width: 639px) {
    @apply grid-cols-1 gap-y-0.5;
  }
}

.setup-guide__mono {
  @apply font-mono;
}

.setup-guide__strong {
  @apply text-gray-900 dark:text-gray-100;
}

.setup-guide__muted {
  @apply text-gray-600 dark:text-gray-400;
}

.setup-guide__hint {
  @apply m-0 mt-1 text-xs text-gray-600 dark:text-gray-400;
}

.setup-guide__link-btn {
  @apply ml-2 text-[13px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200;

  @media (max-width: 639px) {
    @apply inline-flex items-center min-h-[44px];
  }
}

.setup-guide__host-form {
  @apply flex flex-wrap items-center gap-2;

  .setup-guide__link-btn {
    @apply ml-0;
  }

  .setup-guide__hint {
    @apply basis-full mt-0;
  }
}

.setup-guide__host-input {
  @apply h-8 min-w-0 flex-1 rounded px-2 font-mono text-[13px];
  @apply bg-transparent text-gray-900 dark:text-gray-100 border border-gray-500 dark:border-gray-400;

  @media (max-width: 639px) {
    @apply h-11 basis-full;
  }
}

.setup-guide__use {
  @apply h-8 px-3 rounded text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700;

  @media (max-width: 639px) {
    @apply h-11 px-4;
  }
}

.setup-guide__warn {
  @apply m-0 mt-3 text-[13px] text-amber-700 dark:text-amber-400;
}

.setup-guide__steps {
  @apply m-0 mt-5 p-0 list-none text-sm leading-[22px];
  counter-reset: step;

  li {
    @apply relative pl-6 my-1.5;
    counter-increment: step;

    &::before {
      content: counter(step);
      @apply absolute left-0 w-6 font-medium text-gray-600 dark:text-gray-400;
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 639px) {
      @apply pl-5;
    }
  }
}

.setup-guide__steps,
.setup-guide__target {
  .setup-guide__mono {
    font-variant-ligatures: none;
  }
}

.setup-tabs {
  @apply mt-5;
}

.setup-guide__panel {
  @apply mt-4;
}

.setup-guide__stack-hint {
  @apply mt-2;
}

.setup-guide__legend {
  @apply m-0 mt-2 text-xs text-gray-600 dark:text-gray-400;
}

.setup-guide__footer {
  @apply mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-[13px] text-gray-600 dark:text-gray-400;
}

a,
button,
input {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;
  @apply focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800;
}
</style>
