import { ProfilerEdge } from "~/src/entities/profiler/types";

export type CallStackHoverData = ProfilerEdge & { position: { x: number; y: number } }
