// Every setting the page shows, with the words search looks at. One place for
// the section list, the search and the row text (#5874).

import { MENU_ITEMS } from './menu-items'

export type SettingItem = {
  id: string
  label: string
  // One line under the label.
  hint: string
  // The long explanation behind «More».
  more?: string
  // Other words people may type: not shown.
  keywords?: string[]
}

export type SettingsSection = {
  id: string
  title: string
  items: SettingItem[]
}

export const SETTINGS_ITEMS = {
  theme: {
    id: 'theme',
    label: 'Theme',
    hint: 'Choose how Buggregator looks',
    keywords: ['light', 'dark', 'system', 'color', 'mode']
  },
  pinHeader: {
    id: 'pin-header',
    label: 'Pin header',
    hint: 'Keep the header bar visible while scrolling',
    keywords: ['fixed', 'sticky', 'top']
  },
  eventCounts: {
    id: 'event-counts',
    label: 'Event counts',
    hint: 'Show counts next to event types in the menu',
    keywords: ['badge', 'sidebar', 'menu', 'number']
  },
  singleKey: {
    id: 'single-key-shortcuts',
    label: 'Single-key shortcuts',
    hint: 'j/k to move, x to delete, 0–9 to switch pages.',
    more:
      'Keys without Ctrl, Alt or Cmd: j/k or ↑/↓ to move through the list, x to delete, 0–9 to ' +
      'switch pages, ? for the list. Turning this off frees ↑/↓ for scrolling too. Turn off if ' +
      'they get in the way of typing or a screen reader.',
    keywords: ['keyboard', 'hotkeys', 'keys']
  },
  keyHints: {
    id: 'key-hints',
    label: 'Show key hints',
    hint: 'Small key badges next to fields.',
    more:
      'Small key badges: hints next to search boxes and other fields, and, while single-key ' +
      'shortcuts are on, a bar with the main keys on the event list and event pages. Press ? ' +
      'for the full list (also a single-key shortcut).',
    keywords: ['keyboard', 'badges', 'help']
  },
  desktopNotifications: {
    id: 'desktop-notifications',
    label: 'Desktop notifications',
    hint: 'A notification on a new error while you work in another window.',
    more:
      'Buggregator shows a browser notification when a new error (a Sentry exception, or a message ' +
      'at level error or fatal) arrives in any project while this tab is in the background. Several ' +
      'errors in a row make one notification. A click opens the error. The browser asks for ' +
      'permission once; it works on localhost and https only.',
    keywords: ['notification', 'alert', 'popup', 'desktop', 'browser', 'error', 'exception', 'push']
  },
  menuItems: {
    id: 'menu-items',
    label: 'Menu items',
    hint: 'Hidden items still collect events, and Ctrl/⌘+K still finds them.',
    keywords: [
      'sidebar', 'navigation', 'hide', 'show', 'left menu', 'sections',
      ...MENU_ITEMS.map((item) => item.label)
    ]
  },
  codeEditor: {
    id: 'code-editor',
    label: 'Code editor',
    hint: 'Open file paths from events in your editor',
    keywords: ['ide', 'phpstorm', 'vscode', 'link', 'open']
  },
  pathMapping: {
    id: 'path-mapping',
    label: 'Custom file path mapping',
    hint: 'Open files whose path differs on your machine.',
    more:
      'Map event file paths to your local project structure automatically, making it possible ' +
      'to open files outside your project root or with different path prefixes.',
    keywords: ['docker', 'path', 'source', 'target', 'mapping', 'editor']
  },
  emailRelay: {
    id: 'email-relay',
    label: 'Email relay',
    hint: 'Send a caught email to a real inbox.',
    more:
      'Buggregator can pass a caught email on to an outgoing SMTP server (your mail provider, ' +
      'or Mailpit for a test), to see it on a phone or in a real mail client. The relay is set in ' +
      'the server config (smtp_relay in buggregator.yaml or SMTP_RELAY_* variables); here it is ' +
      'read-only. Then use «Send to inbox» on an email page.',
    keywords: ['smtp', 'mail', 'email', 'relay', 'release', 'inbox', 'send', 'forward', 'outgoing']
  },
  about: {
    id: 'about',
    label: 'About & updates',
    hint: 'Versions, updates and links',
    keywords: ['version', 'update', 'upgrade', 'server', 'client', 'release', 'github', 'docs', 'documentation', 'discord']
  }
} satisfies Record<string, SettingItem>

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    items: [SETTINGS_ITEMS.theme, SETTINGS_ITEMS.pinHeader, SETTINGS_ITEMS.eventCounts]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    items: [SETTINGS_ITEMS.desktopNotifications]
  },
  {
    id: 'menu',
    title: 'Menu',
    items: [SETTINGS_ITEMS.menuItems]
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    items: [SETTINGS_ITEMS.singleKey, SETTINGS_ITEMS.keyHints]
  },
  {
    id: 'editor',
    title: 'Editor',
    items: [SETTINGS_ITEMS.codeEditor, SETTINGS_ITEMS.pathMapping]
  },
  {
    id: 'email',
    title: 'Email relay',
    items: [SETTINGS_ITEMS.emailRelay]
  },
  // The id stays «updates»: the header pill and the menu dot link to #updates.
  {
    id: 'updates',
    title: 'About & updates',
    items: [SETTINGS_ITEMS.about]
  }
]
