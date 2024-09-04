import type { ProfilerEdge } from "@/entities/profiler/types";

export type CallStackHoverData = ProfilerEdge & { position: { x: number; y: number } }
