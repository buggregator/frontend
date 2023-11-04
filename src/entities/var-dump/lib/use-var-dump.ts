import { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import { VarDump } from "../types";
import { normalizeVarDumpEvent } from "./normalize-var-dump-event";

type TUseVarDump = () => {
  normalizeVarDumpEvent: (event: ServerEvent<VarDump>) => NormalizedEvent<VarDump>
}

export const useVarDump: TUseVarDump = () => ({
  normalizeVarDumpEvent
})
