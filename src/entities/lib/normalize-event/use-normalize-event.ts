import { NormalizedEvent, Profiler, ServerEvent } from "~/config/types";
import { normalizeProfilerEvent } from "./normalize-profile-event";
// TODO: need to move types to FSD structure

type TUseNormalizer = () => {
  normalizeProfilerEvent: (event: ServerEvent<Profiler>) => NormalizedEvent
}

export const useNormalizeEvent: TUseNormalizer = () => ({
  normalizeProfilerEvent
})
