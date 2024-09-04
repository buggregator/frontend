import type { ProfilerCost } from "@/entities/profiler/types";

export type TNode = {
  data: {
    id: string,
    parent: string | null,
    name: string,
    cost?: ProfilerCost,
    color?: string,
    textColor?: string,
  }
}

export type TEdge = {
  data: {
    id?: string,
    source: string,
    target: string,
    label?: string,
    color?: string,
    weight?: number,
  }
}
