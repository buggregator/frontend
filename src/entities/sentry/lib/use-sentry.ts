import type { ServerEvent, NormalizedEvent } from "@/shared/types"
import type { Sentry } from "../types"
import { normalizeSentryEvent } from "./normalize-sentry-event"

type TUseSentry = () => {
  normalizeSentryEvent: (event: ServerEvent<Sentry>) => NormalizedEvent<Sentry>
}

export const useSentry: TUseSentry = () => ({
  normalizeSentryEvent
})
