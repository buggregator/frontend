import type { RouteLocationRaw } from 'vue-router'
import { MENU_EVENT_GROUPS, MENU_TOOL_IDS, PAGES_SETTINGS } from '@/shared/constants'
import { EventTypes, RouteName } from '@/shared/types'
import { fillText } from '../setup-guide'

// The empty home's channel panel (#6012, design #6005 variant 2): one card per
// way into this server, in the menu's groups.

export type ChannelState = 'listening' | 'off' | 'offline'

export type Channel = {
  id: string
  title: string
  icon: string
  // Where to point the app, filled with this server's values.
  address: string
  state: ChannelState
  // How to turn an off listener on.
  offHint?: string
  // The card's page; null when the channel has none (or is off).
  to: RouteLocationRaw | null
  // Event channels count their events; tools do not.
  eventType?: EventTypes
}

export type ChannelGroup = { id: string; title: string; channels: Channel[] }

export type ChannelInput = {
  availableEvents: string[]
  // Settings › Menu: ids hidden from the menu.
  hidden: string[]
  xdebugEnabled: boolean
  // Listener ports the server did not open (resolveValues().off).
  off: Set<string>
  values: Record<string, string>
  // The WebSocket to this server is up.
  connected: boolean
}

export const ALL_EVENT_TYPES_LIST: string[] = MENU_EVENT_GROUPS.flatMap((g) => g.types)

// What a person points the app at, in the setup help's placeholders.
const ADDRESS: Record<string, string> = {
  [EventTypes.Sentry]: 'http://sentry@{host}:{http_port}/{project}',
  [EventTypes.Profiler]: 'http://profiler:{project}@{host}:{http_port}',
  [EventTypes.Inspector]: 'http://inspector:{project}@{host}:{http_port}',
  [EventTypes.RayDump]: 'ray:{project}@{host}:{http_port}',
  [EventTypes.HttpDump]: 'http://http-dump:{project}@{host}:{http_port}',
  [EventTypes.VarDump]: 'tcp://{host}:{vardumper_port}',
  [EventTypes.XdebugTrace]: 'http://{host}:{http_port} · X-Buggregator-Event: xdebug-trace',
  [EventTypes.Smtp]: 'smtp://{host}:{smtp_port}',
  [EventTypes.Sms]: 'http://{host}:{http_port}/sms/{project}',
  [EventTypes.Monolog]: 'tcp://{host}:{monolog_port}',
  'http-proxy': 'http://{host}:{proxy_port}',
  [MENU_TOOL_IDS.mockServer]: 'http://mock:{project}@{host}:{http_port}/mock/…',
  [MENU_TOOL_IDS.xdebug]: '{host}:{xdebug_port}'
}

// Channels on a listener of their own: its port, and the setting that opens it.
const LISTENER: Record<string, { port: string; env: string }> = {
  [EventTypes.Smtp]: { port: 'smtp_port', env: 'SMTP_ADDR' },
  [EventTypes.VarDump]: { port: 'vardumper_port', env: 'VAR_DUMPER_ADDR' },
  [EventTypes.Monolog]: { port: 'monolog_port', env: 'MONOLOG_ADDR' },
  'http-proxy': { port: 'proxy_port', env: 'PROXY_ADDR' },
  [MENU_TOOL_IDS.xdebug]: { port: 'xdebug_port', env: 'XDEBUG_PROXY_ENABLED' }
}

const TOOLS: { id: string; title: string; icon: string; to: RouteLocationRaw | null }[] = [
  { id: 'http-proxy', title: 'HTTP proxy', icon: 'host', to: null },
  { id: MENU_TOOL_IDS.mockServer, title: 'Mock server', icon: 'mock-server', to: { name: RouteName.MockServer } },
  { id: MENU_TOOL_IDS.xdebug, title: 'Xdebug', icon: 'bug', to: { name: RouteName.Xdebug } }
]

const stateOf = (id: string, input: ChannelInput): ChannelState => {
  if (!input.connected) return 'offline'
  if (id === MENU_TOOL_IDS.xdebug) return input.xdebugEnabled ? 'listening' : 'off'
  const listener = LISTENER[id]
  return listener && input.off.has(listener.port) ? 'off' : 'listening'
}

const card = (
  input: ChannelInput,
  base: Pick<Channel, 'id' | 'title' | 'icon' | 'to' | 'eventType'>
): Channel => {
  const state = stateOf(base.id, input)
  const listener = LISTENER[base.id]
  return {
    ...base,
    address: fillText(ADDRESS[base.id] ?? '', input.values),
    state,
    offHint: state === 'off' && listener ? `Turn it on with ${listener.env}` : undefined,
    // An off channel's page has nothing to show yet.
    to: state === 'off' ? null : base.to
  }
}

export const buildChannelGroups = (input: ChannelInput): ChannelGroup[] => {
  const shown = (id: string) => !input.hidden.includes(id)

  const groups: ChannelGroup[] = MENU_EVENT_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    channels: group.types
      .filter((type) => input.availableEvents.includes(type) && shown(type))
      .map((type) =>
        card(input, {
          id: type,
          title: PAGES_SETTINGS[type].sidebarTitle,
          icon: PAGES_SETTINGS[type].iconName,
          eventType: type,
          to: type === EventTypes.Sentry ? '/sentry/exceptions' : { name: RouteName.EventList, params: { type } }
        })
      )
  }))

  groups.push({
    id: 'tools',
    title: 'Tools',
    // The proxy has no menu entry of its own, so nothing hides it.
    channels: TOOLS.filter((t) => t.id === 'http-proxy' || shown(t.id)).map((t) => card(input, t))
  })

  return groups.filter((g) => g.channels.length > 0)
}
