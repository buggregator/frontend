import type { StatsBase } from "../../types";

export type StatBoardCost = StatsBase & {
  p_cpu?: number;
  p_wt?: number;
  p_mu?: number;
  p_pmu?: number;
};

export enum StatBoardSize {
  Small = "sm",
  Medium = "md",
}
