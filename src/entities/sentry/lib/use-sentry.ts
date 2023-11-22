import { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import { Sentry } from "../types";
import { normalizeSentryEvent } from "./normalize-sentry-event";

type TUseSentry = () => {
  normalizeSentryEvent: (event: ServerEvent<Sentry>) => NormalizedEvent<Sentry>
}

export const useSentry: TUseSentry = () => ({
  normalizeSentryEvent
})
