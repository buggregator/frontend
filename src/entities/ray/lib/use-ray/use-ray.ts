import type { ServerEvent } from '~/src/shared/types';
import type { EnhancedRayEvent, RayDump } from "../../types";
import { COMPONENT_TYPE_MAP } from "./config";
import { normalizeRayEvent } from "./normalize-ray-event";

type TUseRay = () => {
  normalizeRayEvent: (event: ServerEvent<RayDump>) => EnhancedRayEvent
  COMPONENT_TYPE_MAP: typeof COMPONENT_TYPE_MAP
}

export const useRay: TUseRay = () => ({
  normalizeRayEvent,
  COMPONENT_TYPE_MAP
})
