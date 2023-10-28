import { NormalizedEvent, Profiler, ServerEvent } from "~/config/types";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent
}

export const useProfiler: TUseProfiler = () => ({
  normalizeProfilerEvent
})
