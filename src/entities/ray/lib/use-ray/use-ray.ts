import type { ServerEvent } from '~/src/shared/types';
import type { EnhancedRayEvent, RayDump } from "../../types";
import { normalizeRayEvent } from "./normalize-ray-event";

type TUseRay = () => {
  normalizeRayEvent: (event: ServerEvent<RayDump>) => EnhancedRayEvent
}

export const useRay: TUseRay = () => ({
  normalizeRayEvent
})
