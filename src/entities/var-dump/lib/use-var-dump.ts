import { ServerEvent } from '~/src/shared/types';
import { NormalizedVarDump, VarDump } from "../types";
import { normalizeVarDumpEvent } from "./normalize-var-dump-event";

type TUseVarDump = () => {
  normalizeVarDumpEvent: (event: ServerEvent<VarDump>) => NormalizedVarDump
}

export const useVarDump: TUseVarDump = () => ({
  normalizeVarDumpEvent
})
