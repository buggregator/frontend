import { type EventId, LOCAL_STORAGE_KEYS} from "../../types";
import type {TEventsCachedIdsMap} from "./types";

const { localStorage } = window;

export const getStoredCachedIds = (): TEventsCachedIdsMap | null => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TEventsCachedIdsMap;
  }

  return null;
};

export const setStoredCachedIds = (cachedEventMap: TEventsCachedIdsMap) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS, JSON.stringify(cachedEventMap));
}


export const getStoredLockedIds = (): EventId[] | null => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.LOCKED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as EventId[];
  }

  return null;
};

export const setStoredLockedIds = (lockedIds: EventId[]) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.LOCKED_EVENTS, JSON.stringify(lockedIds));
}
