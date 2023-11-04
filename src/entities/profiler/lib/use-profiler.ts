import { Profiler } from "~/config/types";
import { ServerEvent } from '~/src/shared/types';
import { NormalizedProfiler } from "../types";
import { normalizeProfilerEvent } from "./normalize-profile-event";

type TUseProfiler = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedProfiler
}

export const useProfiler: TUseProfiler = () => ({
  normalizeProfilerEvent
})
