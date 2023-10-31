import { NormalizedEvent, Profiler } from "~/config/types";
import { ServerEvent } from '~/src/shared/types';
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent
}

export const useProfiler: TUseProfiler = () => ({
  normalizeProfilerEvent
})
