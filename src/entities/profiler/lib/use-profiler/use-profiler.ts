import {useProfilerRequests} from "~/src/shared/lib/io/use-profiler-requests";
import type {ServerEvent, NormalizedEvent, EventId} from '~/src/shared/types';
import type {Profiler, ProfilerCallGraph, ProfilerTopFunctions} from "../../types";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent<Profiler>
  getTopFunctions: (id: EventId, params?: Record<string, string>) => Promise<ProfilerTopFunctions>
  getCallGraph: (id: EventId, params?: Record<string, string>) => Promise<ProfilerCallGraph>
}

export const useProfiler: TUseProfiler = () => {
  const { getTopFunctions, getCallGraph } = useProfilerRequests();

  return {
    normalizeProfilerEvent,
    getTopFunctions,
    getCallGraph,
}}
