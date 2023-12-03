import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type { Inspector } from "../../types";
import { normalizeInspectorEvent } from "./normalize-inspector-event";

type TUseInspector = () => {
  normalizeInspectorEvent: (event: ServerEvent<Inspector>) => NormalizedEvent<Inspector>
}

export const useInspector: TUseInspector = () => ({
  normalizeInspectorEvent
})
