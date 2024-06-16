import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type {HttpDump, HttpDumpServer} from "../../types";
import { normalizeHttpDumpEvent } from "./normalize-http-dump-event";

type TUseInspector = () => {
  normalizeHttpDumpEvent: (event: ServerEvent<HttpDumpServer>) => NormalizedEvent<HttpDump>
}

export const useHttpDump: TUseInspector = () => ({
  normalizeHttpDumpEvent
})
