import type { MockOpenAPIImport, MockRule } from '../types'

// The import form as the person fills it.
export interface MockImportDraft {
  source: 'paste' | 'url'
  spec: string
  url: string
  project: string
  group: string
  // true: prefix paths with the path of the spec's servers[0].url.
  fromServers: boolean
  basePath: string
}

export const emptyImportDraft = (): MockImportDraft => ({
  source: 'paste',
  spec: '',
  url: '',
  project: '',
  group: '',
  fromServers: true,
  basePath: ''
})

// The request body: one source, optional fields only when set.
export const buildImport = (d: MockImportDraft): MockOpenAPIImport => {
  const out: MockOpenAPIImport = d.source === 'url' ? { url: d.url.trim() } : { spec: d.spec }
  if (d.project) out.project = d.project
  if (d.group.trim()) out.group = d.group.trim()
  if (!d.fromServers) out.base_path = d.basePath.trim()
  return out
}

// The group whose header goes before rule i: set where a run of one group
// starts (rules can be reordered, so one group may show in several runs).
export const groupHeaderAt = (list: MockRule[], i: number): string | null => {
  const group = list[i]?.group || ''
  if (!group) return null
  return (list[i - 1]?.group || '') === group ? null : group
}

// Editable rules per group: what a re-import replaces and a group delete removes.
export const storedGroupSizes = (list: MockRule[]): Map<string, number> => {
  const sizes = new Map<string, number>()
  list.forEach((r) => {
    if (r.group && !r.read_only) sizes.set(r.group, (sizes.get(r.group) || 0) + 1)
  })
  return sizes
}
