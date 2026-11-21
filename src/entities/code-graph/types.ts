// Code graph API (buggregator/server #467, openapi tag «Code graph»).

export type CodeRootState = 'pending' | 'indexing' | 'ready' | 'error'

export type CodeRootStatus = {
  name: string
  // Absolute folder on the server, symlinks resolved.
  path: string
  state: CodeRootState
  files?: number
  symbols?: number
  edges?: number
  parse_errors?: number
  files_seen?: number
  files_parsed?: number
  files_skipped?: number
  truncated?: boolean
  started_at?: string
  indexed_at?: string
  duration_ms?: number
  error?: string
}

export type CodeGraphRoots = {
  // False when `code_graph.roots` is empty: the other routes are absent.
  enabled: boolean
  snippets: boolean
  roots: CodeRootStatus[]
}

export type CodeSymbolKind =
  | 'namespace'
  | 'package'
  | 'class'
  | 'interface'
  | 'trait'
  | 'enum'
  | 'struct'
  | 'type'
  | 'function'
  | 'method'

export type CodeSymbol = {
  id: number
  root: string
  kind: CodeSymbolKind
  name: string
  fqn: string
  // Relative to the root.
  file: string
  line_start: number
  line_end: number
  signature?: string
  parent_id?: number
}

export type CodeRelation = {
  kind: 'imports' | 'extends' | 'implements' | 'uses'
  fqn: string
  symbol?: CodeSymbol
  line: number
}

export type CodeSymbolDetail = CodeSymbol & {
  parent?: CodeSymbol
  members: CodeSymbol[]
  relations: CodeRelation[]
  incoming: CodeRelation[]
  callers: number
  name_calls?: number
  callees: number
  // Only with `code_graph.snippets: true`.
  source?: string
  source_from?: number
}

export type CodeEdgeKind = 'imports' | 'extends' | 'implements' | 'uses' | 'calls' | 'instantiates'

export type CodeGraphNode = {
  // s:<symbol id>, ns:<namespace>, x:<name> (outside the index), f:<file>.
  id: string
  symbol_id?: number
  // folder: drawn by the page (packages of one folder folded together).
  kind: CodeSymbolKind | 'external' | 'file' | 'folder'
  name: string
  fqn: string
  file?: string
  line?: number
  external?: boolean
  // Hops from the start; 0 for the start.
  depth: number
  // Whole-root graph (#6582): symbols folded into this node, and the opened
  // node it was drawn from (`expand`).
  size?: number
  group?: string
}

export type CodeGraphEdge = {
  from: string
  to: string
  kind: CodeEdgeKind
  // name: a method call on a value of unknown type, matched by name.
  confidence: 'exact' | 'name'
  line?: number
  count: number
}

export type CodeGraph = {
  nodes: CodeGraphNode[]
  edges: CodeGraphEdge[]
  truncated: boolean
}

export type CodeFileEntry = {
  name: string
  path: string
  dir: boolean
  files?: number
  lang?: 'php' | 'go'
  symbols: number
  parse_error?: boolean
}

export type CodeOutlineItem = CodeSymbol & { members: CodeOutlineItem[] }

// GET /api/code/top: functions and methods by exact incoming calls, tests left out.
export type CodeTopSymbol = CodeSymbol & { callers: number }
