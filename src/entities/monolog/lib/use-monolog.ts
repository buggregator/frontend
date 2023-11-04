import { ServerEvent } from '~/src/shared/types';
import { NormalizedMonolog, Monolog } from "../types";
import { normalizeMonolog } from "./normalize-monolog";

type TUseMonolog = () => {
  normalizeMonologEvent: (event: ServerEvent<Monolog>) => NormalizedMonolog
}

export const useMonolog: TUseMonolog = () => ({
  normalizeMonologEvent: normalizeMonolog
})
