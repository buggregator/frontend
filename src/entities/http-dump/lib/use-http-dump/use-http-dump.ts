import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type { HttpDump } from "../../types";
import { normalizeHttpDumpEvent } from "./normalize-http-dump-event";

type TUseInspector = () => {
  normalizeHttpDumpEvent: (event: ServerEvent<HttpDump>) => NormalizedEvent<HttpDump>
}

export const useHttpDump: TUseInspector = () => ({
  normalizeHttpDumpEvent
})
