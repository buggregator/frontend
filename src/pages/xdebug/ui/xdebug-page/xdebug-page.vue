<script lang="ts" setup>
import {
  createReusableTemplate,
  useDebounceFn,
  useIntervalFn,
  useNow,
  useTitle
} from '@vueuse/core'
import { computed, onMounted, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar } from '@/widgets/ui'
import {
  breakpointRows,
  closedReasonText,
  gutterMarks,
  closedTitle,
  isLive,
  sessionTitle,
  splitPath,
  useXdebugBreakpoints,
  useXdebugControl,
  useXdebugDebugger,
  useXdebugRequests,
  useXdebugSessions,
  xdebugModeText,
  onXdebugMessage,
  onXdebugReconnect,
  XdebugAgentTimeline,
  XdebugBreakpointAdd,
  XdebugBreakpoints,
  XdebugCallStack,
  XdebugCodeView,
  XdebugControlBar,
  XdebugIcon,
  XdebugSessionRow,
  XdebugSetupGuide,
  XdebugVarTree,
  XdebugWatches
} from '@/entities/xdebug'
import { AppHeader } from '@/shared/ui'
import { XdebugSettingsButton } from '../xdebug-settings-button'

useTitle('Xdebug | Buggregator')

const api = useXdebugRequests()
const list = useXdebugSessions(api)
const { config, sessions } = list

const route = useRoute()
const router = useRouter()

// The selected session lives in the URL (?session=3), so a reload keeps it.
const selectedId = computed(() => {
  const wanted = String(route.query.session ?? '')
  if (sessions.value.some((s) => s.id === wanted)) return wanted
  const paused = sessions.value.find((s) => s.state === 'break')
  return (paused ?? sessions.value[0])?.id ?? null
})
const selected = computed(() => sessions.value.find((s) => s.id === selectedId.value) ?? null)
const select = (id: string) => router.replace({ query: { ...route.query, session: id } })

const allowEval = computed(() => !!config.value?.allow_eval)
const dbg = useXdebugDebugger(api, selected, allowEval)

// Saved breakpoints (server PR #401). The server sends a change to the
// paused session before it answers, so the session's states are re-read after
// each change from here; an agent's change comes as `breakpoints.changed`.
// Own changes and their `breakpoints.changed` echo share one debounced re-read.
const reloadSessionBreakpoints = useDebounceFn(() => dbg.reloadBreakpoints(), 300)
const bps = useXdebugBreakpoints(api, () => reloadSessionBreakpoints())

onXdebugMessage((message) => {
  list.apply(message)
  dbg.apply(message)
  bps.apply(message)
  if (message.event === 'breakpoints.changed' && selected.value?.driver === 'here')
    reloadSessionBreakpoints()
})
onXdebugReconnect(() => {
  list.load()
  dbg.refresh()
  if (showBreakpoints.value) bps.load()
})
onMounted(() => list.load())
useIntervalFn(() => list.tick(), 30_000)

// Controls of a session Buggregator drives (server PR #392); `now` ticks the idle countdown.
const now = useNow({ interval: 1000 })
const ctl = useXdebugControl(
  api,
  selected,
  computed(() => now.value.getTime())
)
// Older servers have no `mode`: the page stays read-only, as before.
const hasModes = computed(() => !!config.value?.mode)
const showControls = computed(
  () =>
    !!selected.value &&
    (selected.value.driver === 'here' || (hasModes.value && config.value?.mode !== 'proxy'))
)
// What the script does after a command from here; values on screen are from the last stop.
const runningText = computed(() => {
  if (ctl.lastCommand.value === 'detach') return 'Releasing the script: it runs on to the end.'
  if (ctl.lastCommand.value === 'stop') return 'Stopping the request.'
  return 'Running until the script pauses again. Values below are from the last stop.'
})

// The timeline of a session driven here: who stepped, and agents may step too.
const timelineText = computed(() =>
  selected.value?.driver === 'here'
    ? {
        pausedBy: ctl.lastBy.value ? `last step: ${ctl.lastBy.value}` : 'stopped here',
        hint: 'MCP calls an agent made in this session.'
      }
    : {}
)
const agentDriving = computed(
  () => selected.value?.state === 'running' && selected.value.last_continuation_by === 'agent'
)

const ideAddr = computed(() => config.value?.ide_addr ?? '127.0.0.1:9004')
const port = (addr: string | undefined) => addr?.split(':').pop() ?? ''

// After a step (IDE or here), the old values stay on screen until the next
// pause. The stack decides, not only the stale flag, so the code and the
// control bar do not blink between the `running` event and the stale mark.
const stepping = computed(
  () =>
    !!selected.value &&
    selected.value.state === 'running' &&
    (dbg.stale.value || dbg.stack.value.length > 0)
)
const live = computed(() => !!selected.value && isLive(selected.value))
const showDebugger = computed(
  () => !!selected.value && (selected.value.state === 'break' || stepping.value)
)

const frame = computed(() => dbg.currentFrame.value)
const crumb = computed(() => splitPath(frame.value?.file ?? selected.value?.last_file))
const crumbLine = computed(() => frame.value?.line ?? selected.value?.last_line)
const breakpointLines = computed(() =>
  dbg.breakpoints.value
    .filter((b) => b.line && b.file === (dbg.source.value?.file ?? frame.value?.file))
    .map((b) => b.line as number)
)

// Buggregator drives the selected session: the gutter and the panel edit.
const drivenHere = computed(() => selected.value?.driver === 'here')
// Mode proxy and older servers: no saved breakpoints (today's page).
const showBreakpoints = computed(
  () =>
    !!config.value?.enabled &&
    (drivenHere.value || (hasModes.value && config.value.mode !== 'proxy'))
)
const bpReadOnly = computed(() => selected.value?.driver === 'ide')
const bpRows = computed(() =>
  breakpointRows(bps.list.value, dbg.breakpoints.value, drivenHere.value)
)
const bpOn = computed(() => bps.list.value.filter((b) => b.enabled).length)
const gutter = computed(() =>
  gutterMarks(dbg.source.value?.file, bps.list.value, dbg.breakpoints.value, drivenHere.value)
)
const toggleBreakpoint = (line: number) => {
  const file = dbg.source.value?.file
  if (file) bps.toggleLine(file, line)
}
watch(
  showBreakpoints,
  (on) => {
    if (on && bps.state.value === 'idle') bps.load()
  },
  { immediate: true }
)

const [DefineBreakpoints, ReuseBreakpoints] = createReusableTemplate()

// No sessions yet in Auto / Standalone: say Buggregator will pause here.
const drivesHere = computed(() => hasModes.value && config.value?.mode !== 'proxy')
const savedText = computed(() => {
  const n = bpOn.value
  if (!n) return 'your breakpoints'
  return `your ${n} saved ${n === 1 ? 'breakpoint' : 'breakpoints'}`
})
const modeText = computed(() =>
  xdebugModeText(config.value?.mode, port(config.value?.ide_addr), savedText.value)
)
const settingsButton = useTemplateRef<InstanceType<typeof XdebugSettingsButton>>('settingsButton')

const contextLabel = (name: string) => (name === 'User defined constants' ? 'User constants' : name)

const dismiss = async (id: string) => {
  try {
    await list.dismiss(id)
  } catch {
    // A session that came back to life cannot be dismissed; the list shows it as live.
    list.load()
  }
}

const sessionsLabel = computed(
  () => `${sessions.value.length} ${sessions.value.length === 1 ? 'session' : 'sessions'}`
)

// The pick is written into the URL, so the selection stays put while that
// session runs; it moves only when the session is gone.
watch(
  selectedId,
  (id) => {
    if (id && route.query.session !== id) router.replace({ query: { ...route.query, session: id } })
  },
  { immediate: true }
)
</script>

<template>
  <DefineBreakpoints>
    <details
      class="xdebug-sec"
      open
    >
      <summary>
        <XdebugIcon name="down" />Breakpoints
        <span class="xdebug-sec__count">{{ bps.list.value.length }}</span>
        <span
          v-if="bps.list.value.length && !bpReadOnly"
          class="xdebug-sec__right"
        >{{ bpOn }} on</span>
      </summary>
      <XdebugBreakpoints
        :rows="bpRows"
        :read-only="bpReadOnly"
        :allow-eval="allowEval"
        :show-hits="drivenHere && dbg.paused.value"
        :busy="bps.busy.value"
        :row-error="bps.rowError.value"
        :load-error="bps.state.value === 'error'"
        :save-condition="bps.setCondition"
        @enable="bps.setEnabled"
        @remove="bps.remove"
        @retry="bps.load()"
      >
        <XdebugBreakpointAdd
          v-if="!bpReadOnly && bps.state.value !== 'error'"
          :add="bps.add"
          :find-files="api.findFiles"
          :adding="bps.adding.value"
          :server-error="bps.addError.value"
          @edit="bps.clearAddError()"
        />
      </XdebugBreakpoints>
    </details>
  </DefineBreakpoints>

  <LayoutBase>
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader keep-title>
        <h1 class="xdebug-page__title">
          Xdebug
        </h1>
        <span
          v-if="config?.enabled"
          class="xdebug-page__count"
        >{{ sessionsLabel }}</span>
        <template #controls>
          <span
            v-if="config?.enabled && (!hasModes || config.mode === 'proxy')"
            class="xdebug-page__tag xdebug-page__hide-s"
            :title="`Xdebug connects to ${config.addr}; Buggregator forwards to your IDE at ${config.ide_addr}`"
          >
            <XdebugIcon name="check" />proxy :{{ port(config.addr) }} → IDE :{{
              port(config.ide_addr)
            }}
          </span>
          <span
            v-if="config?.enabled"
            class="xdebug-page__tag xdebug-page__hide-s"
          >
            <XdebugIcon
              v-if="!allowEval"
              name="lock"
            />{{ allowEval ? 'eval on' : 'eval off' }}
          </span>
          <XdebugSettingsButton
            v-if="config?.enabled && hasModes"
            ref="settingsButton"
            :config="config"
            @saved="list.setSettings"
          />
        </template>
      </AppHeader>
    </template>

    <div class="xdebug-page">
      <!-- page states before there is anything to debug -->
      <div
        v-if="list.state.value === 'loading'"
        class="xdebug-page__center"
        aria-busy="true"
      >
        <p class="xdebug-page__muted">
          Loading…
        </p>
      </div>

      <div
        v-else-if="list.state.value === 'error'"
        class="xdebug-page__center"
      >
        <div class="xdebug-page__empty">
          <XdebugIcon
            name="warn"
            class="xdebug-page__empty-ico"
          />
          <h2>Could not load the Xdebug proxy</h2>
          <p>
            The server did not answer <code>/api/xdebug</code>. It may be an older Buggregator
            without the Xdebug module.
          </p>
          <button
            type="button"
            class="xdebug-page__btn"
            @click="list.load()"
          >
            Try again
          </button>
        </div>
      </div>

      <div
        v-else-if="!config?.enabled"
        class="xdebug-page__center"
      >
        <div class="xdebug-page__empty">
          <XdebugIcon
            name="lock"
            class="xdebug-page__empty-ico"
          />
          <h2>Xdebug proxy is off</h2>
          <p>
            Set <code>xdebug.enabled: true</code> in <code>buggregator.yaml</code> or
            <code>XDEBUG_PROXY_ENABLED=true</code>, and restart.
          </p>
        </div>
      </div>

      <div
        v-else-if="!sessions.length"
        class="xdebug-page__center"
      >
        <div class="xdebug-page__empty xdebug-page__empty--wide">
          <XdebugIcon
            name="bug"
            class="xdebug-page__empty-ico"
          />
          <h2>No session has reached Buggregator yet</h2>
          <p>
            Mode <b>{{ modeText.mode }}</b>: {{ modeText.text }}
          </p>
          <XdebugSetupGuide :config="config" />
          <template v-if="drivesHere">
            <p
              v-if="config.pause_on_first_line"
              class="xdebug-page__hint"
            >
              <b>Pause on the first line</b> is on: every new session stops at its first line.
            </p>
            <p
              v-else
              class="xdebug-page__hint"
            >
              No breakpoint yet? Turn on
              <button
                type="button"
                class="xdebug-page__link"
                @click="settingsButton?.show($event)"
                v-text="'Pause on the first line'"
              />, run the request, then click line numbers.
            </p>
          </template>
          <div
            v-if="showBreakpoints"
            class="xdebug-page__bpcard"
          >
            <ReuseBreakpoints />
          </div>
        </div>
      </div>

      <!-- the debugger -->
      <div
        v-else
        class="xdebug-page__grid"
      >
        <aside
          class="xdebug-page__side"
          aria-label="Debug panels"
        >
          <details
            class="xdebug-sec xdebug-sec--sessions"
            open
          >
            <summary>
              <XdebugIcon name="down" />Sessions
              <span class="xdebug-sec__count">{{ sessions.length }}</span>
            </summary>
            <XdebugSessionRow
              v-for="s in sessions"
              :key="s.id"
              :session="s"
              :selected="s.id === selectedId"
              :stepping="s.id === selectedId && stepping"
              :ide-addr="ideAddr"
              @select="select(s.id)"
              @dismiss="dismiss(s.id)"
            />
          </details>

          <template v-if="showDebugger">
            <details
              class="xdebug-sec"
              open
            >
              <summary>
                <XdebugIcon name="down" />Variables
                <span
                  v-if="dbg.frame.value > 0"
                  class="xdebug-sec__count"
                >frame #{{ dbg.frame.value }}</span>
              </summary>
              <div
                class="xdebug-tabs"
                role="tablist"
                aria-label="Variable scope"
              >
                <button
                  v-for="c in dbg.contexts.value"
                  :key="c.id"
                  type="button"
                  role="tab"
                  :aria-selected="c.id === dbg.contextId.value"
                  :disabled="!dbg.paused.value"
                  @click="dbg.selectContext(c.id)"
                >
                  {{ contextLabel(c.name) }}
                </button>
              </div>
              <p
                v-if="dbg.varsState.value === 'error'"
                class="xdebug-page__err"
              >
                <XdebugIcon name="warn" />Could not read the variables.
              </p>
              <XdebugVarTree
                v-else
                :vars="dbg.variables.value"
                :changed="dbg.changed.value"
                :loading="dbg.varsState.value === 'loading'"
                :stale="dbg.stale.value"
                @expand="(name, page) => dbg.expand(name, page)"
                @show-full="(name) => dbg.showFull(name)"
              />
            </details>

            <details class="xdebug-sec">
              <summary>
                <XdebugIcon name="down" />Watch
                <span
                  v-if="dbg.watches.value.length"
                  class="xdebug-sec__count"
                >{{
                  dbg.watches.value.length
                }}</span>
              </summary>
              <XdebugWatches
                :rows="dbg.watches.value"
                :allow-eval="allowEval"
                :paused="dbg.paused.value"
                @add="dbg.addWatch"
                @remove="dbg.removeWatch"
              />
            </details>
          </template>

          <ReuseBreakpoints v-if="showBreakpoints" />

          <template v-if="showDebugger">
            <details
              class="xdebug-sec"
              open
            >
              <summary>
                <XdebugIcon name="down" />Call stack
                <span class="xdebug-sec__count">{{ dbg.stack.value.length }}</span>
              </summary>
              <XdebugCallStack
                :frames="dbg.stack.value"
                :selected="dbg.frame.value"
                :disabled="!dbg.paused.value"
                @select="dbg.selectFrame"
              />
            </details>
          </template>

          <details class="xdebug-sec xdebug-sec--agent">
            <summary>
              <XdebugIcon name="down" />Agent
              <span class="xdebug-sec__count">{{ dbg.agentLog.value.length }}</span>
            </summary>
            <XdebugAgentTimeline
              :calls="dbg.agentLog.value"
              :inflight="dbg.inflight.value"
            />
          </details>
        </aside>

        <section
          class="xdebug-page__mid"
          aria-label="Source"
        >
          <div class="xdebug-page__msel">
            <label
              for="xdebug-session-select"
              class="sr-only"
            >Session</label>
            <select
              id="xdebug-session-select"
              class="xdebug-page__select"
              :value="selectedId ?? ''"
              @change="select(($event.target as HTMLSelectElement).value)"
            >
              <option
                v-for="s in sessions"
                :key="s.id"
                :value="s.id"
              >
                {{ s.state === 'break' ? '⏸' : isLive(s) ? '▶' : '✕' }} #{{ s.id }}
                {{ sessionTitle(s) }}
              </option>
            </select>
          </div>

          <div
            v-if="ctl.error.value"
            class="xdebug-page__banner xdebug-page__banner--err"
            role="alert"
          >
            <XdebugIcon name="warn" />
            <span>{{ ctl.error.value }}</span>
            <button
              type="button"
              class="xdebug-page__btn xdebug-page__btn--sm"
              @click="ctl.dismissError()"
            >
              Dismiss
            </button>
          </div>

          <div
            v-if="stepping && agentDriving"
            class="xdebug-page__banner xdebug-page__banner--agent"
            role="status"
          >
            <XdebugIcon name="agent" />
            <span>{{
              ctl.lastBy.value === 'an agent' ? 'An agent' : `The ${ctl.lastBy.value}`
            }}
              resumed the script via MCP, waiting for the next pause.</span>
          </div>
          <div
            v-else-if="stepping"
            class="xdebug-page__banner"
            role="status"
          >
            <span class="xdebug-page__spin" />
            <span v-if="selected?.driver === 'here'">{{ runningText }}</span>
            <span v-else>The IDE resumed the script, waiting for the next pause. Values are from the last
              stop.</span>
          </div>

          <template v-if="showDebugger">
            <XdebugControlBar
              v-if="showControls"
              :key="selected?.id"
              :can-control="ctl.canControl.value"
              :pending="ctl.pending.value"
              :driven-by-ide="ctl.drivenByIde.value"
              :running="selected?.state === 'running'"
              :agent-driving="agentDriving"
              :idle-left="ctl.idleLeft.value"
              :last-by="ctl.lastBy.value"
              @command="ctl.send"
            />
            <div class="xdebug-page__edhd">
              <span
                class="xdebug-page__crumb"
                :title="frame?.file"
              >{{ crumb.dir }}<b>{{ crumb.name }}</b>:{{ crumbLine }}</span>
              <span
                v-if="!showControls"
                class="xdebug-page__pill"
                tabindex="0"
                title="This version is read-only: resume and step from your IDE. Buttons here come in a later version."
              >
                <XdebugIcon name="lock" /><span>Stepping: in your IDE</span>
              </span>
            </div>
            <XdebugCodeView
              class="xdebug-page__code"
              :source="dbg.source.value"
              :line="frame?.line ?? null"
              :is-top-frame="dbg.frame.value === 0"
              :breakpoint-lines="breakpointLines"
              :editable="drivenHere && showControls"
              :marks="gutter"
              :loading="dbg.sourceState.value === 'loading' || dbg.stackState.value === 'loading'"
              :error="
                dbg.stackState.value === 'error'
                  ? 'Could not read the call stack.'
                  : dbg.sourceError.value
              "
              :stale="dbg.stale.value"
              @toggle="toggleBreakpoint"
            />
          </template>

          <div
            v-else-if="selected && live"
            class="xdebug-page__center"
          >
            <div class="xdebug-page__empty">
              <XdebugIcon
                name="play"
                class="xdebug-page__empty-ico"
              />
              <h2>Running</h2>
              <p>
                No breakpoint hit yet. Source, variables and stack appear when the script pauses.
              </p>
              <p
                v-if="selected.last_file"
                class="xdebug-page__muted"
              >
                Last known: <code>{{ crumb.name }}:{{ selected.last_line }}</code>
              </p>
            </div>
          </div>

          <div
            v-else-if="selected"
            class="xdebug-page__center"
          >
            <div
              class="xdebug-page__callout"
              role="status"
            >
              <XdebugIcon name="warn" />
              <div>
                <p>
                  <b>{{ closedTitle(selected) }}</b>
                  {{
                    closedReasonText(selected.closed_reason, ideAddr, config?.idle_timeout_seconds)
                  }}
                </p>
                <p v-if="selected.closed_reason === 'idle_detached'">
                  A paused script holds a PHP worker, the session file and any open transaction, so
                  Buggregator lets idle ones go. Change it with <code>xdebug.idle_timeout</code>.
                </p>
                <p v-if="selected.closed_reason === 'ide_unreachable'">
                  Start listening in your IDE on port {{ port(ideAddr) }}, or change
                  <code>xdebug.ide_addr</code>.
                </p>
                <button
                  type="button"
                  class="xdebug-page__btn"
                  @click="dismiss(selected.id)"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside
          class="xdebug-page__tl"
          aria-label="Agent activity"
        >
          <div class="xdebug-page__tlh">
            <XdebugIcon name="agent" />Agent activity
            <span class="xdebug-sec__count">{{ dbg.agentLog.value.length }}</span>
          </div>
          <XdebugAgentTimeline
            :calls="dbg.agentLog.value"
            :inflight="dbg.inflight.value"
            :paused-at="selected?.state === 'break' ? selected.paused_at : ''"
            :paused-file="selected?.last_file"
            :paused-line="selected?.last_line"
            v-bind="timelineText"
          />
        </aside>
      </div>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.xdebug-page {
  @apply flex flex-col h-full min-h-0 bg-gray-50 dark:bg-gray-900;
}

.xdebug-page__title {
  @apply text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap;
}

.xdebug-page__count {
  @apply ml-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap;
}

.xdebug-page__tag {
  @apply inline-flex items-center gap-1 h-6 px-2 rounded border text-2xs whitespace-nowrap;
  @apply border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300;
}

.xdebug-page__hide-s {
  @media (max-width: 767px) {
    @apply hidden;
  }
}

.xdebug-page__grid {
  @apply flex-1 min-h-0 grid;

  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(250px, 300px);

  @media (max-width: 1179px) {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }

  @media (max-width: 767px) {
    @apply flex flex-col overflow-auto;
  }
}

.xdebug-page__side {
  @apply min-h-0 overflow-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800;

  @media (max-width: 767px) {
    @apply order-2 overflow-visible border-r-0 flex-none;
  }
}

.xdebug-sec {
  @apply border-b border-gray-200 dark:border-gray-700;

  > summary {
    @apply sticky top-0 z-[2] flex items-center gap-1.5 h-[30px] px-2 cursor-pointer list-none select-none;
    @apply text-2xs font-bold uppercase tracking-wider text-gray-600 bg-white dark:text-gray-300 dark:bg-gray-800;

    &::-webkit-details-marker {
      @apply hidden;
    }

    &:focus-visible {
      @apply outline-none ring-2 ring-inset ring-blue-500;
    }

    > .xdebug-icon {
      @apply transition-transform motion-reduce:transition-none;
    }

    @media (max-width: 767px) {
      @apply h-11 px-3 text-xs;
    }
  }

  &:not([open]) > summary > .xdebug-icon {
    @apply -rotate-90;
  }
}

.xdebug-sec__right {
  @apply ml-auto normal-case tracking-normal font-medium text-gray-500 dark:text-gray-400;
}

.xdebug-page__bpcard {
  @apply mt-4 rounded-md border text-left border-gray-200 dark:border-gray-700 overflow-visible;

  .xdebug-sec {
    @apply border-b-0;
  }
}

.xdebug-sec__count {
  @apply normal-case tracking-normal font-normal text-gray-500 dark:text-gray-400;
}

.xdebug-sec--sessions {
  @media (max-width: 767px) {
    @apply hidden;
  }
}

.xdebug-sec--agent {
  @apply hidden;

  @media (max-width: 1179px) {
    @apply block;
  }
}

.xdebug-tabs {
  @apply flex gap-0.5 px-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto;

  button {
    @apply h-7 px-2.5 border-b-2 border-transparent text-xs font-medium whitespace-nowrap text-gray-600 dark:text-gray-300;
    @apply disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500;

    &[aria-selected='true'] {
      @apply border-blue-500 text-gray-900 dark:text-white;
    }
  }
}

.xdebug-page__mid {
  @apply flex flex-col min-w-0 min-h-0;

  @media (max-width: 767px) {
    @apply order-1 flex-none;
  }
}

.xdebug-page__msel {
  @apply hidden;

  @media (max-width: 767px) {
    @apply flex px-3 py-2 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800;
  }
}

.xdebug-page__select {
  @apply w-full h-11 px-2 rounded border font-mono text-xs border-gray-300 bg-white text-gray-900;
  @apply dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.xdebug-page__edhd {
  @apply flex items-center gap-2.5 h-10 px-3 flex-none min-w-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#0d1320];
}

.xdebug-page__crumb {
  @apply flex-1 min-w-0 truncate font-mono text-xs text-gray-600 dark:text-gray-300;

  b {
    @apply text-gray-900 dark:text-white;
  }
}

.xdebug-page__pill {
  @apply inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full border border-dashed whitespace-nowrap cursor-help;
  @apply text-2xs font-semibold border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;

  @media (max-width: 767px) {
    span {
      @apply sr-only;
    }
  }
}

.xdebug-page__code {
  @apply flex-1 min-h-0;

  @media (max-width: 767px) {
    @apply flex-none max-h-[260px];
  }
}

.xdebug-page__banner {
  @apply flex items-center gap-2 px-3 py-1.5 flex-none text-xs border-b;
  @apply bg-green-50 text-gray-800 border-gray-200 dark:bg-green-500/10 dark:text-gray-200 dark:border-gray-700;
}

.xdebug-page__banner--agent {
  @apply bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300;

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }
}

.xdebug-page__banner--err {
  @apply bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300;

  .xdebug-icon {
    @apply w-3.5 h-3.5;
  }

  .xdebug-page__btn {
    @apply ml-auto;
  }
}

.xdebug-page__btn--sm {
  @apply h-6 text-2xs;
}

.xdebug-page__spin {
  @apply inline-block w-2.5 h-2.5 rounded-full border-[1.5px] border-green-700 border-r-transparent animate-spin dark:border-green-400 dark:border-r-transparent;

  @media (prefers-reduced-motion: reduce) {
    @apply animate-none;
  }
}

.xdebug-page__tl {
  @apply flex flex-col min-h-0 overflow-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800;

  @media (max-width: 1179px) {
    @apply hidden;
  }
}

.xdebug-page__tlh {
  @apply flex items-center gap-1.5 h-8 px-3 flex-none border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400;

  .xdebug-icon {
    @apply w-3.5 h-3.5 text-violet-700 dark:text-violet-400;
  }
}

.xdebug-page__center {
  @apply flex flex-1 justify-center p-6 overflow-auto;

  // Centred with margins, not align-items: a block taller than the screen
  // then scrolls from its top instead of being cut off above it.
  > * {
    @apply my-auto;
  }
}

.xdebug-page__empty {
  @apply flex flex-col items-center gap-2 max-w-md text-center text-sm text-gray-600 dark:text-gray-300;

  h2 {
    @apply text-base font-semibold text-gray-900 dark:text-white;
  }

  code {
    @apply font-mono text-xs px-1 rounded bg-gray-100 dark:bg-gray-800;
  }
}

.xdebug-page__hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.xdebug-page__link {
  @apply underline text-blue-700 dark:text-blue-300 rounded;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.xdebug-page__empty--wide {
  @apply max-w-3xl;
}

.xdebug-page__empty-ico {
  @apply w-8 h-8 text-gray-500 dark:text-gray-400;
}

.xdebug-page__callout {
  @apply flex gap-2 max-w-lg p-3 rounded border text-sm;
  @apply border-rose-200 bg-rose-50 text-gray-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-gray-200;

  > .xdebug-icon {
    @apply w-4 h-4 mt-0.5 text-rose-700 dark:text-rose-400;
  }

  p + p,
  p + button {
    @apply mt-2;
  }

  code {
    @apply font-mono text-xs;
  }
}

.xdebug-page__btn {
  @apply inline-flex items-center h-8 px-3 rounded border text-xs font-medium;
  @apply border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.xdebug-page__muted {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.xdebug-page__err {
  @apply flex items-center gap-1.5 px-3 py-2 text-xs text-rose-700 dark:text-rose-400;
}
</style>
