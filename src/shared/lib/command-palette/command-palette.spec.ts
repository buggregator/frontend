import { describe, expect, it } from 'vitest'
import { type Command, commandScore, filterCommands } from './command-palette'

const cmd = (group: Command['group'], label: string, extra: Partial<Command> = {}): Command => ({
  id: label,
  group,
  label,
  run: () => {},
  ...extra,
})

const commands = [
  cmd('pages', 'SMTP — mail', { keywords: ['email'] }),
  cmd('pages', 'Mock server'),
  cmd('pages', 'Monolog'),
  cmd('settings', 'Custom file path mapping'),
  cmd('actions', 'Clear all events'),
]

describe('filterCommands', () => {
  it('finds pages, settings and actions in the groups order', () => {
    const sections = filterCommands(commands, 'ma')
    expect(sections.map((s) => [s.id, s.commands.map((c) => c.label)])).toEqual([
      ['pages', ['SMTP — mail']],
      ['settings', ['Custom file path mapping']],
    ])
  })

  it('puts a label that starts with the query first', () => {
    const labels = filterCommands(commands, 'mo')[0].commands.map((c) => c.label)
    expect(labels).toEqual(['Mock server', 'Monolog'])
    expect(filterCommands([cmd('pages', 'Xmock'), cmd('pages', 'Mock')], 'mock')[0].commands.map((c) => c.label)).toEqual(['Mock', 'Xmock'])
  })

  it('finds a command by a word that is not shown', () => {
    expect(filterCommands(commands, 'EMAIL')[0].commands[0].label).toBe('SMTP — mail')
  })

  it('shows everything for an empty query', () => {
    expect(filterCommands(commands, '  ').flatMap((s) => s.commands)).toHaveLength(commands.length)
  })

  it('leaves out groups with no match', () => {
    expect(filterCommands(commands, 'zzz')).toEqual([])
  })
})

describe('commandScore', () => {
  it('ranks start, word start, inside and hidden words', () => {
    const c = cmd('pages', 'HTTP dumps', { note: 'requests' })
    expect(commandScore(c, 'http')).toBe(0)
    expect(commandScore(c, 'dum')).toBe(1)
    expect(commandScore(c, 'umps')).toBe(2)
    expect(commandScore(c, 'request')).toBe(3)
    expect(commandScore(c, 'quests')).toBeNull()
    expect(commandScore(c, 'zzz')).toBeNull()
  })
})
