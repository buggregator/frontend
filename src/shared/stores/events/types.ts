import type { EventId } from '../../types/events';
import type { PageEventTypes } from '../../types/pages';

export type TEventsCachedIdsMap = Record<PageEventTypes, EventId[]>;
