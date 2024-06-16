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
}

export interface ProfilerEdge {
  id: string,
  parent: string | null,
  caller: string | null,
  callee: string,
  cost: ProfilerCost
}

export interface Profiler {
  tags: {
    [key: string]: string | null | number
  },
  app_name: string,
  hostname: string,
  date: number,
  peaks: ProfilerCost,
}
