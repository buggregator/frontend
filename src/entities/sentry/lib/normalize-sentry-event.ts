import { normalizeEvent } from "@/shared/lib/normalize-event";
import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import { EventTypes } from "@/shared/types";
import type { Sentry } from "../types";
import { sentryMessageText } from "./resolve-exceptions";

// Only the origin values the SDK sent: an unset one is left out, not shown as «null» or «-».
const pickSet = (values: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null && v !== undefined && v !== '')) as Record<string, string>

// captureMessage (even with an attached stacktrace) is a message, not an exception.
const kindLabel = (payload?: Sentry): string =>
  !payload?.exception?.values?.length && sentryMessageText(payload) ? 'message' : 'exception'

export const normalizeSentryEvent = (event: ServerEvent<Sentry>): NormalizedEvent<Sentry> =>
  normalizeEvent(event, {
    type: EventTypes.Sentry,
    labels: [EventTypes.Sentry, kindLabel(event.payload)],
    origin: pickSet({
      logger: event.payload?.logger,
      environment: event.payload?.environment,
      release: event.payload?.release,
    }),
    serverName: event.payload?.server_name || '',
  })
