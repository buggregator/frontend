import { ServerEvent, NormalizedEvent } from '../../types';
import { normalizeUnknownEvent } from "./normalize-unknown-event";

type TUseEvents = () => {
  normalizeUnknownEvent: (event: ServerEvent<unknown>) => NormalizedEvent<unknown>
}

export const useEvents: TUseEvents = () => ({
  normalizeUnknownEvent
})
