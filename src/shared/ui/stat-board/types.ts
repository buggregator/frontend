export type StatBoardCost = {
  ct: number;
  cpu: number;
  p_cpu?: number;
  wt: number;
  p_wt?: number;
  mu: number;
  p_mu?: number;
  pmu: number;
  p_pmu?: number;
}

export enum StatBoardSize {
  Small= 'sm',
  Medium = 'md',
}
