import type { NormalizedEvent, ServerEvent } from '@/shared/types';
import type { RayDump } from '../../types';
import { COMPONENT_TYPE_MAP } from './config';
import { normalizeRayEvent } from './normalize-ray-event';

type TUseRay = () => {
  normalizeRayEvent: (event: ServerEvent<RayDump>) => NormalizedEvent<RayDump>;
  COMPONENT_TYPE_MAP: typeof COMPONENT_TYPE_MAP;
};

export const useRay: TUseRay = () => ({
  normalizeRayEvent,
  COMPONENT_TYPE_MAP,
});
