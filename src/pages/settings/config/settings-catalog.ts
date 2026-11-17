// Every setting the page shows, with the words search looks at. One place for
// the section list, the search and the row text (#5874).

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
    id: 'keyboard',
    title: 'Keyboard',
    items: [SETTINGS_ITEMS.singleKey, SETTINGS_ITEMS.keyHints]
  },
  {
    id: 'editor',
    title: 'Editor',
    items: [SETTINGS_ITEMS.codeEditor, SETTINGS_ITEMS.pathMapping]
  },
  // The id stays «updates»: the header pill and the menu dot link to #updates.
  {
    id: 'updates',
    title: 'About & updates',
    items: [SETTINGS_ITEMS.about]
  }
]
