import {useProfilerRequests} from "~/src/shared/lib/io/use-profiler-requests";
import type {ServerEvent, NormalizedEvent, EventId} from '~/src/shared/types';
import type {Profiler, ProfilerTopFunctions} from "../../types";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent<Profiler>
  getTopFunctions: (id: EventId, params?: Record<string, string>) => Promise<ProfilerTopFunctions>
}

export const useProfiler: TUseProfiler = () => {
  const { getTopFunctions } = useProfilerRequests();

  return {
    normalizeProfilerEvent,
    getTopFunctions,
}}
