import { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import { RayDump } from "../../types";
import { normalizeRayEvent } from "./normalize-ray-event";

type TUseRay = () => {
  normalizeRayEvent: (event: ServerEvent<RayDump>) => NormalizedEvent<RayDump>
}

export const useRay: TUseRay = () => ({
  normalizeRayEvent
})
