import type {EventId} from "../../types/events";
import type { TEventsGroup } from "../../types/pages";

export type TEventsCachedIdsMap = Record<TEventsGroup, EventId[]>;
