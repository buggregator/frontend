import type {ElementsDefinition} from "cytoscape";

export interface ProfilerCost {
  d_cpu: number;
  d_wt: number;
  d_mu: number;
  d_pmu: number;
  ct: number;
  wt: number;
  cpu: number;
  mu: number;
  pmu: number;
  p_cpu: number;
  p_mu: number;
  p_pmu: number;
  p_wt: number;
  excl_cpu: number,
  excl_wt: number,
  excl_pmu: number,
  excl_mu: number,
  excl_ct: number,
}

export interface ProfilerEdge {
  id: string,
  parent: string | null,
  caller: string | null,
  callee: string,
  cost: Partial<ProfilerCost> // TOO: need to fix types
}

export interface ProfilerEdges {
  [key: string]: ProfilerEdge
}

export interface Profiler {
  tags: {
    [key: string]: string | null | number
  },
  app_name: string,
  hostname: string,
  date: number,
  peaks: {
    "cpu": number,
    "ct": number,
    "mu": number,
    "pmu": number,
    "wt": number
  },
}

export interface ProfilerTopFunctions {
  functions: Array<ProfilerCost & { function: string }>,
  schema: {
    description: string
    key: string
    label: string
    sortable: boolean
    values: { key: (keyof ProfilerCost), format: string, type?: 'sub' }[]
  }[],
  overall_totals: Partial<ProfilerCost>
}

export interface ProfilerCallGraph extends ElementsDefinition {
  toolbar: Array<{
    description: string
    label: string
    metric: (keyof ProfilerCost)[number]
  }>
}

export interface ProfileFlameChart {
  children: ProfileFlameChart[],
  color: string
  cost: Partial<ProfilerCost>
  duration: number
  name: string
  start: number
  type: "task" | string
}

export type CallStackHoverData = ProfilerEdge & { position: { x: number; y: number } }
