import { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import { HttpDump } from "../../types";
import { normalizeHttpDumpEvent } from "./normalize-http-dump-event";

type TUseInspector = () => {
  normalizeHttpDumpEvent: (event: ServerEvent<HttpDump>) => NormalizedEvent<HttpDump>
}

export const useHttpDump: TUseInspector = () => ({
  normalizeHttpDumpEvent
})
