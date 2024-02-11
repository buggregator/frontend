import type { ServerEvent, NormalizedEvent } from '../../types';
import { normalizeUnknownEvent } from "./normalize-unknown-event";
import { useEventsPlugin, type TUseEventsPluginData } from "./use-events-plugin";

type TUseEvents = () => {
  normalizeUnknownEvent: (event: ServerEvent<unknown>) => NormalizedEvent<unknown>
  events: TUseEventsPluginData
}

export const useEvents: TUseEvents = () => ({
  normalizeUnknownEvent,
  events: useEventsPlugin()
})
