import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type { Monolog } from "../../types";
import { normalizeMonolog } from "./normalize-monolog";

type TUseMonolog = () => {
  normalizeMonologEvent: (event: ServerEvent<Monolog>) => NormalizedEvent<Monolog>
}

export const useMonolog: TUseMonolog = () => ({
  normalizeMonologEvent: normalizeMonolog
})
