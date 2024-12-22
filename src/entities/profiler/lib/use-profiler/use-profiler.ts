import {useProfilerRequests} from "@/shared/lib/io/use-profiler-requests";
import type {ServerEvent, NormalizedEvent, EventId} from '@/shared/types';
import type {StatBoardCost} from "../../types";
import type {ProfileFlameChart, Profiler, ProfilerCallGraph, ProfilerTopFunctions} from "../../types";
import { calcStatItems } from "./calc-stat-items";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent<Profiler>
  getTopFunctions: (id: EventId, params?: Record<string, string>) => Promise<ProfilerTopFunctions>
  getCallGraph: (id: EventId, params?: Record<string, string>) => Promise<ProfilerCallGraph>
  getFlameChart: (id: EventId, params?: Record<string, string>) => Promise<ProfileFlameChart[]>
  calcStatItems: (cost: StatBoardCost) => Array<{ title: string, value: string, percent?: number }>
}

export const useProfiler: TUseProfiler = () => {
  const { getTopFunctions, getCallGraph, getFlameChart } = useProfilerRequests();

  return {
    normalizeProfilerEvent,
    getTopFunctions,
    getCallGraph,
    getFlameChart,
    calcStatItems,
}}
