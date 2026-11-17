import { ref } from 'vue'

// The Ctrl/⌘+K window (idea 5, #5871): go to a page, a project or a setting,
// or run an action, from the keyboard.
export const isCommandPaletteOpen = ref(false)

// How the key reads on this machine: ⌘K on Apple devices, Ctrl K elsewhere.
export const paletteKeyCaption = (): string =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'

export type CommandGroup = 'pages' | 'projects' | 'settings' | 'actions'

export const COMMAND_GROUPS: { id: CommandGroup; title: string }[] = [
  { id: 'pages', title: 'Pages' },
  { id: 'projects', title: 'Projects' },
  { id: 'settings', title: 'Settings' },
  { id: 'actions', title: 'Actions' },
]

export type Command = {
  id: string
  group: CommandGroup
  label: string
  // A short note on the right: «4 new», «current», a section name.
  note?: string
  // Other words people may type: not shown.
  keywords?: string[]
  icon?: string
  run: () => void
}

const words = (text: string) => text.split(/[\s—\-/&,.():]+/)

// 0 = the label starts with the query, 1 = a word of it does, 2 = the label
// has it somewhere, 3 = only a hidden word or the note has it; null = no match.
export const commandScore = (command: Command, query: string): number | null => {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const label = command.label.toLowerCase()
  if (label.startsWith(q)) return 0
  if (words(label).some((word) => word.startsWith(q))) return 1
  if (label.includes(q)) return 2
  // Hidden words count from a word's start: «ma» finds «mail», not «performance».
  const hidden = [command.note ?? '', ...(command.keywords ?? [])]
  if (hidden.some((text) => words(text.toLowerCase()).some((word) => word.startsWith(q)) || text.toLowerCase().startsWith(q))) return 3
  return null
}

export type CommandSection = { id: CommandGroup; title: string; commands: Command[] }

// The matching commands, in the groups' order; inside a group the best match
// comes first and equal ones keep their order.
export const filterCommands = (commands: readonly Command[], query: string): CommandSection[] =>
  COMMAND_GROUPS.map((group) => ({
    ...group,
    commands: commands
      .map((command, index) => ({ command, index, score: commandScore(command, query) }))
      .filter((item) => item.command.group === group.id && item.score !== null)
      .sort((a, b) => a.score! - b.score! || a.index - b.index)
      .map((item) => item.command),
  })).filter((section) => section.commands.length > 0)
