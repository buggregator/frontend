import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type { Profiler } from "../../types";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent<Profiler>
}

export const useProfiler: TUseProfiler = () => ({
  normalizeProfilerEvent
})
