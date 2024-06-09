export interface ProfilerCost {
  [key: string]: number,

  "ct": number,
  "wt": number,
  "cpu": number,
  "mu": number,
  "pmu": number
}

export interface ProfilerEdge {
  id: string,
  parent: string | null,
  caller: string | null,
  callee: string,
  cost: ProfilerCost
}

export type ProfilerEdges = Record<string, ProfilerEdge>

export interface Profiler {
  tags: {
    [key: string]: string | null | number
  },
  app_name: string,
  hostname: string,
  profile_uuid: string,
  date: number,
  peaks: ProfilerCost,
  // edges: ProfilerEdges
}
