import type { ElementsDefinition } from 'cytoscape';
import type { StatsBase } from '@/shared/types';
import type { StatBoardCost } from '@/shared/ui';

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
  excl_cpu: number;
  excl_wt: number;
  excl_pmu: number;
  excl_mu: number;
  excl_ct: number;
}

export interface Profiler {
  tags: Record<string, string | null | number>;
  app_name: string;
  hostname: string;
  date: number;
  peaks: StatsBase;
}

export interface ProfilerTopFunctions {
  functions: (ProfilerCost & { function: string })[];
  schema: {
    description: string;
    key: string;
    label: string;
    sortable: boolean;
    values: { key: keyof ProfilerCost; format: string; type?: 'sub' }[];
  }[];
  overall_totals: StatBoardCost;
}

export interface ProfilerCallGraph extends ElementsDefinition {
  toolbar: {
    description: string;
    label: string;
    metric: (keyof ProfilerCost)[number];
  }[];
}

export interface ProfileFlameChart {
  children: ProfileFlameChart[];
  color: string;
  cost: Partial<ProfilerCost>;
  duration: number;
  name: string;
  start: number;
  type: 'task' | string;
}

export interface CallStackHoverData {
  title: string;
  cost: Partial<ProfilerCost>;
}
